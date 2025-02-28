import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "@/styles/timeline.module.css";
import { BarsProp, sub_column, bar } from "@/interfaces/barsProp";
import axios from "axios";
import ContextMenu from "./contextMenu";
import { animated, SpringRef, SpringValue } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useSprings } from "@react-spring/web";

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
  setBarsDataChangeAfterZoom: React.Dispatch<
    React.SetStateAction<BarsProp | null>
  >;
  barsData: BarsProp | null;
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  mediaContainerWidth: number;
  setFetchBars: React.Dispatch<React.SetStateAction<boolean>>;
  bar: bar;
  barIndex: number;
  bars: bar[];
  startResize: (
    e: React.MouseEvent,
    direction: "left" | "right",
    barId: number
  ) => void;
  setBarsData: React.Dispatch<React.SetStateAction<BarsProp | null>>;
  setUpdateBarsData: React.Dispatch<React.SetStateAction<boolean>>;
}
const Clip: React.FC<ClipProps> = ({
  item,
  isEmpty,
  barsDataChangeAfterZoom,
  setBarsDataChangeAfterZoom,
  barsData,
  contextMenu,
  setContextMenu,
  mediaContainerWidth,
  setFetchBars,
  bar,
  barIndex,
  bars,
  startResize,
  setBarsData,
  setUpdateBarsData,
}) => {
  //state hooks
  const [options, setOptions] = useState<
    { label: string; action: () => void }[]
  >([]);
  const [storeMappedBar, setStoreMappedBar] = useState<bar[]>([]);

  //refs

  const icons: { [key: string]: string } = {
    audio: "/audio.png",
    video: "/video.png",
    image: "/image.png",
    text: "/text.png",
  };

  // use gesture and spring
  // const { clipLP, clipWidth } = springs;
  let width: number;
  let left_position: number;
  const minWidth = 250; // min width for clip, used during resizing

  const zoomBarsMap = new Map();
  barsDataChangeAfterZoom?.sub_columns?.forEach((subCol) => {
    subCol?.bars?.forEach((zoomBar) => zoomBarsMap.set(zoomBar.id, zoomBar));
  });

  const zoomBar = zoomBarsMap.get(bar?.id);
  width = zoomBar?.width || bar?.width; // bar.width and lp are from barsdata hook
  left_position = zoomBar?.left_position || bar?.left_position;

  // in the returned array first arg are spring values, second arg is api which control these spring
  // usespring hook takes either config or function, here using function
  const [springs, api] = useSprings(
    bars.length,
    (i) => ({
      barID: bars[i].id,
      clipLP: left_position || 0, // initial lp
      clipWidth: width || 0, // initial width
      config: { tension: 300, friction: 30 }, // smooth animation
      immediate: true,
    }),
    []
  );

  // useEffect(() => {
  //   console.log(
  //     "Springs array:",
  //     springs.map((s, i) => ({
  //       index: i,
  //       barID: s.barID?.get(),
  //       clipLP: s.clipLP.get(),
  //       clipWidth: s.clipWidth.get(),
  //     }))
  //   );
  // }, [springs]);

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
    bars: bar[],
    barIndex: number,
    newWidth: number,
    newLeftPosition: number
  ) => {
    barsData?.sub_columns?.map(async (subcol) => {
      const targetBar = subcol.bars?.find((b) => b.id === bar.id);
      console.log("barsdatachangeafterzoom in updatebarafterresize", barsData);
      console.log("newleft position bro", newLeftPosition);
      if (targetBar) {
        const updatebar = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/bars/${targetBar.id}`,
          {
            ...bar,
            left_position: newLeftPosition,
            width: newWidth,
            start_time: bar.start_time,
            end_time: bar.end_time, // chaning this makes start_time 0
          }
        );
        await calculateGap(subcol, bar, bars, barIndex);
        console.log("barsdata before updating it", barsData);
        console.log("updatedbar  data", updatebar.data[0]);
        setBarsData(updatebar.data[0]);
        setUpdateBarsData(true);
      }
      return subcol;
    });
  };

  // use gesture and spring
  const bindDrag = useDrag(
    ({ movement: [dx], args: [barId], event }) => {
      if (event.target && (event.target as HTMLElement).closest(".handle"))
        // if the target element or its ancestors contain handle class than stop
        return;
      api.start((i) => {
        const clipWidth = springs[i].clipWidth.get();
        if (bar.id !== barId.get()) return {};
        const minX = 0;
        const maxX = mediaContainerWidth - bar.width; // prevent going beyond right edge
        const newX = Math.max(minX, Math.min(dx, maxX));
        console.log(
          " clip width",
          "left pos",
          clipWidth,
          springs[i].clipLP.get()
        );
        // console.log("dx and maxx", dx, maxX);
        // console.log("newx binddrag", newX);
        return { clipLP: newX, immediate: true };
      });
    },
    { axis: "x" }
  );

  const bindLeftResize = useDrag(
    ({ movement: [dx], args: [barId], last }) => {
      // console.log(
      //   "might appear after barsdata updated, running in bindleftresize",
      //   barsData
      // );
      barsData?.sub_columns?.forEach((subColumn) => {
        subColumn?.bars?.forEach((bar, barIndex) => {
          if (bar.id !== barId.get()) return;

          const clipWidth = springs[0].clipWidth.get();
          const clipLP = springs[0].clipLP.get();

          console.log("bar.width left resize ", bar.width, clipWidth);

          const newWidth = Math.max(minWidth, bar.width - dx);
          let newX = Math.min(
            bar.left_position + dx,
            bar.left_position + bar.width - minWidth
          );

          if (newX <= 0) newX = bar.left_position;

          api.start(() => ({
            clipLP: newX,
            clipWidth: newWidth,
            immediate: true,
          }));

          if (last) {
            updateBarAfterResize(bar, subColumn.bars, barIndex, newWidth, newX);
          }
        });
      });
    },
    { axis: "x" }
  );

  const bindRightResize = useDrag(
    ({ movement: [dx], args: [barId], last }) => {
      if (bar.id !== barId.get()) return {};
      const clipWidth = springs[0].clipWidth.get();
      const clipLP = springs[0].clipLP.get();

      const newWidth = Math.max(
        minWidth,
        Math.min(bar.width + dx, mediaContainerWidth - bar.left_position)
      );
      // console.log(
      //   "check this",
      //   bar.width,
      //   dx,
      //   mediaContainerWidth,
      //   bar.left_position
      // );
      // console.log("newwidth, RH", newWidth);
      api.start(() => {
        return { clipWidth: newWidth, immediate: true };
      });
      console.log(
        "bar.width right resize ",
        bar.width,
        springs[0].clipWidth.get()
      );
      if (last) {
        updateBarAfterResize(bar, bars, barIndex, newWidth, bar.left_position);
      }
    },

    { axis: "x" }
  );

  // run when clip dropped to another sub col
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
    <div className={styles.clip_sub_col_div} id={barIndex.toString()}>
      {springs.map((spring, index) => (
        <animated.div
          key={index}
          {...bindDrag(spring.barID)}
          className={styles.item_box_div}
          style={{
            // width: width, // width according to stored in db and zoom level
            // left: left_position,
            width: spring.clipWidth.to((w) => `${w}px`),
            transform: spring.clipLP.to((xVal) => `translate(${xVal}px`),
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
                barsData?.sub_columns?.length
                  ? `${styles.item_content_drop}`
                  : ""
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
                    {...bindLeftResize(spring.barID)}
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
                    {...bindRightResize(spring.barID)}
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
      ))}

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
