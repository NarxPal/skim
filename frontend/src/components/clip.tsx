import React, { useState, useRef } from "react";
import Image from "next/image";
import styles from "@/styles/timeline.module.css";
import { BarsProp, sub_column, bar } from "@/interfaces/barsProp";
import axios from "axios";
import ContextMenu from "./contextMenu";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  id: number | null;
}

interface ClipProps {
  item: sub_column;
  isEmpty: boolean;
  barsDataChangeAfterZoom: BarsProp | null;
  barsData: BarsProp | null;
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  mediaContainerWidth: number;
  setFetchBars: React.Dispatch<React.SetStateAction<boolean>>;
  bar: bar;
  barIndex: number;
  bars: bar[];
}
const Clip: React.FC<ClipProps> = ({
  item,
  isEmpty,
  barsDataChangeAfterZoom,
  barsData,
  contextMenu,
  setContextMenu,
  mediaContainerWidth,
  setFetchBars,
  bar,
  barIndex,
  bars,
}) => {
  //state hooks
  const [options, setOptions] = useState<
    { label: string; action: () => void }[]
  >([]);

  //refs

  const icons: { [key: string]: string } = {
    audio: "/audio.png",
    video: "/video.png",
    image: "/image.png",
    text: "/text.png",
  };

  const zoomBarsMap = new Map();
  barsDataChangeAfterZoom?.sub_columns?.forEach((subCol) => {
    subCol?.bars?.forEach((zoomBar) => zoomBarsMap.set(zoomBar.id, zoomBar));
  });

  const zoomBar = zoomBarsMap.get(bar.id);
  const width: number = zoomBar?.width || bar.width; // bar.width and lp are from barsdata hook
  const left_position: number = zoomBar?.left_position || bar.left_position;

  const minWidth = 250; // min width for clip, used during resizing

  const handleGap = async (
    subCol: sub_column,
    gapId: number,
    gapWidth: number,
    startOfGap: number
  ) => {
    try {
      const gap = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/gaps/${gapId}`,
        {
          ...subCol.gaps,
          width: gapWidth - 1,
          start_gap: startOfGap,
          end_gap: gapWidth - 1,
        }
      );
      console.log("gap res", gap.data[0]);
      const clipAfterResize = gap.data[0];
      // setBarsData(clipAfterResize);
      // setBarsDataChangeAfterZoom(clipAfterResize);
      // setGapData(clipAfterResize);
    } catch (error) {
      console.error("Error updating gap:", error);
    }
  };

  const calculateGap = async (
    subcol: sub_column,
    bar: bar,
    bars: bar[],
    barIndex: number
  ) => {
    // calc for first bar clip in the subcol
    if (bar.order === 0) {
      const startOfGap = 0;
      const gapWidth = bar.left_position; // lp of bar would be the end position of gap
      console.log("gap w", gapWidth);
      handleGap(subcol, bar.id, gapWidth, startOfGap);
    }
    // calc for bars clip placed next to first
    else {
      // start of  gap = w + lp of all the prev bars
      // end of gap = lp of next bar
      // width = end gap - start gap

      const previousBars = bars.slice(0, barIndex);
      const startOfGap = previousBars.reduce(
        (totalWidth, prevBar) => totalWidth + prevBar.width,
        previousBars[0]?.left_position || 0
      );

      const endOfGap = bar.left_position;
      const gapWidth = endOfGap - startOfGap;
      console.log("end of gap", endOfGap);
      console.log("start of gap", startOfGap);
      console.log("gapwidth", gapWidth);

      // console.log("gap, start, end", gapWidth, startOfGap, endOfGap);
    }
  };

  const updateBarAfterResize = async (
    bar: bar,
    newLeftPosition: number,
    bars: bar[],
    barIndex: number
  ) => {
    barsDataChangeAfterZoom?.sub_columns?.map(async (subcol) => {
      const targetBar = subcol.bars?.find((b) => b.id === bar.id);
      if (targetBar) {
        axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/bars/${targetBar.id}`,
          {
            ...bar,
            left_position: newLeftPosition,
            width: bar.width,
            start_time: bar.start_time,
            end_time: bar.end_time, // chaning this makes start_time 0
          }
        );
        await calculateGap(subcol, bar, bars, barIndex);
      }
      return subcol;
    });
  };

  // use gesture and spring
  // in the returned array first arg are spring values, second arg is api which control these spring
  // usespring hook takes either config or function, here using function
  const [{ clipLP, clipWidth }, api] = useSpring(() => ({
    clipLP: bar.left_position || 0, // initial lp
    clipWidth: bar.width || 0, // initial width
    config: { tension: 300, friction: 30 }, // smooth animation
  }));

  const bindDrag = useDrag(
    ({ offset: [dx], event }) => {
      if (event.target && (event.target as HTMLElement).closest(".handle"))
        // if the target element or its ancestors contain handle class than stop
        return;

      console.log("barlp, MOVE", bar.left_position, bar.id);
      const minX = 0;
      const maxX = mediaContainerWidth - width; // prevent going beyond right edge
      const newX = Math.max(minX, Math.min(dx, maxX));
      console.log("dx and maxx", dx, maxX);
      console.log("newx binddrag", newX);
      api.start({ clipLP: newX, immediate: true });
    },
    { axis: "x" }
  );

  const bindLeftResize = useDrag(
    ({ offset: [dx] }) => {
      const newWidth = Math.max(minWidth, bar.width - dx);
      console.log("dx bro", width, dx);
      let newX = Math.min(
        bar.left_position + dx,
        bar.left_position + bar.width - minWidth
      );
      if (newX <= 0) {
        newX = bar.left_position;
      }
      console.log("barlp, LEFT RESIZE", bar.left_position, bar.id);
      updateBarAfterResize(bar, newX, bars, barIndex);
      api.start({ clipLP: newX, clipWidth: newWidth, immediate: true });
    },
    { axis: "x" }
  );

  const bindRightResize = useDrag(
    ({ offset: [dx] }) => {
      const newWidth = Math.max(
        minWidth,
        Math.min(bar.width + dx, mediaContainerWidth - bar.left_position)
      );
      // console.log("new width", newWidth);
      api.start({ clipWidth: newWidth, immediate: true });
    },

    { axis: "x" }
  );

  const delCmSubColId = async (subColId: number) => {
    try {
      const delSubCol = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${subColId}`
      );

      console.log("del bar res", delSubCol);
      setFetchBars(true);
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  const delCmBarId = async (cmSubColId: number, cmBarName: string) => {
    console.log("cmsubcolid, cmbarname,", cmSubColId, cmBarName);
    try {
      const delBar = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${cmSubColId}/bars/${cmBarName}`
      );

      console.log("cm del bar res", delBar);
      setFetchBars(true);
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  // ********** context menu functions ************

  const handleRightClickBar = (
    e: React.MouseEvent<HTMLDivElement>,
    bar: bar,
    id: number,
    subColId: number
  ) => {
    e.preventDefault();
    setOptions([
      { label: "edit", action: () => console.log(`Edit ${bar.name}`) },
      { label: "delete", action: () => delCmBarId(subColId, bar.name) },
    ]);
    const container = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: e.clientX - container.left,
      y: e.clientY - container.top,
      id: id,
    });
  };

  // context menu for sub-column
  const handleRightClickSubCol = (
    e: React.MouseEvent<HTMLDivElement>,
    subColId: number
  ) => {
    e.preventDefault();
    setOptions([
      { label: "edit", action: () => console.log(`Edit ${subColId}`) },
      { label: "delete", action: () => delCmSubColId(subColId) },
    ]);
    const container = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: e.clientX - container.left,
      y: e.clientY - container.top,
      id: subColId,
    });
  };

  const handleOptionClick = (option: {
    label: string;
    action: (id: number) => void;
  }) => {
    console.log("option click id", contextMenu.id);
    if (contextMenu.id !== null) {
      option.action(contextMenu.id);
      console.log("option click id", contextMenu.id);
    }
    setContextMenu({ visible: false, x: 0, y: 0, id: null });
  };

  return (
    <div>
      <animated.div
        key={barIndex}
        {...bindDrag()}
        className={styles.item_box_div}
        style={{
          width: width, // width according to stored in db and zoom level
          // left: left_position,
          // width: clipWidth.to((w) => `${w}px`),
          transform: clipLP.to((xVal) => `translate(${xVal}px`),
          touchAction: "none",
        }}
        id={`bar-${bar?.id}`}
        onContextMenu={(e) => handleRightClickBar(e, bar, bar?.id, item?.id)} // here we are passing bar info
      >
        <div
          className={`${
            barsData?.sub_columns === null
              ? `${styles.m_item_box}`
              : `${styles.m_item_box_drop}`
          } group`}
          style={{
            // transform: x.to((xVal) => `translate(${xVal}px`),
            cursor: "grab",
            // touchAction: "none",
          }}
        >
          <div
            className={
              barsData?.sub_columns?.length ? `${styles.item_content_drop}` : ""
            }
          >
            {item && (
              <div className={styles.m_item_keys}>
                <div
                  className={styles.m_item_thumb}
                  style={{
                    backgroundImage: bar?.thumbnail_url
                      ? `url(${bar?.thumbnail_url})`
                      : "none",
                    backgroundRepeat: "repeat-x",
                    backgroundSize: "auto 100%",
                  }}
                ></div>
              </div>
            )}
          </div>

          {/* only show barcontent (bar arrow and label) when width of bar is above 125 */}
          {(width || bar?.width) > 125 && (
            <div className={styles.bar_content}>
              {barsData?.sub_columns?.length ? (
                <div
                  {...bindLeftResize()}
                  className={`${styles.bar_arrow_div} hidden group-hover:flex handle`}
                  // onMouseDown={(e) => startResize(e, "left", bar?.id)}
                  style={{
                    touchAction: "none",
                  }}
                >
                  <div
                    className={`${styles.bar_arrow_left} hidden group-hover:flex`}
                  >
                    <div className={styles.arrow_pad}>
                      <div className={styles.arrow_div}>
                        <Image
                          src="/left_arrow.png"
                          alt="left_arrow"
                          width={10}
                          height={10}
                          priority={true}
                          draggable={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {width >= 300 && (
                <div
                  className={styles.clip_center}
                  // draggable
                  // onDragStart={(e) =>
                  //   handleBarDragStart(bar?.id, e, item?.id)
                  // }
                  // onDragEnd={() => handleBarDragEnd()}
                >
                  <div
                    className={`${styles.m_type_label} hidden group-hover:flex`}
                  >
                    <div className={styles.type_label_content}>
                      <div className={styles.type_icon}>
                        {bar?.type in icons && (
                          <Image
                            src={icons[bar?.type as keyof typeof icons]}
                            alt={bar?.type}
                            width={10}
                            height={10}
                            priority={true}
                          />
                        )}
                      </div>
                      <span className={styles.m_item_label}>
                        {bar?.name.length > 20
                          ? `${bar?.name.substring(0, 25)}...`
                          : bar?.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {barsData?.sub_columns?.length ? ( // length check if there are bars in sub_columns
                <div
                  {...bindRightResize()}
                  className={`${styles.bar_arrow_div} hidden group-hover:flex handle`}
                  // onMouseDown={(e) => startResize(e, "right", bar?.id)}
                  style={{
                    touchAction: "none",
                  }}
                >
                  <div
                    className={`${styles.bar_arrow_right} hidden group-hover:flex`}
                  >
                    <div className={styles.arrow_pad}>
                      <div className={styles.arrow_div}>
                        <Image
                          src="/chevron_right.png"
                          alt="right_arrow"
                          width={10}
                          height={10}
                          priority={true}
                          draggable={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </animated.div>
      {contextMenu.visible && contextMenu.id == bar?.id && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          id={contextMenu.id}
          options={options}
          onOptionClick={handleOptionClick}
          visible={contextMenu.visible}
        />
      )}
    </div>
  );
};

export default Clip;
