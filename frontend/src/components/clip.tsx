import React, { useState, useEffect, useRef } from "react";
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
  // bar: bar;
  barIndex: number;
  bars: bar[];
  setBarsData: React.Dispatch<React.SetStateAction<BarsProp | null>>;
  setUpdateBarsData: React.Dispatch<React.SetStateAction<boolean>>;
  setHoveringOverRow: React.Dispatch<React.SetStateAction<boolean>>;
  rowsRef: React.RefObject<(HTMLDivElement | null)[]>;
  addSubColRef: React.RefObject<HTMLDivElement>;
  mediaParentRef: React.RefObject<HTMLDivElement | null>;
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
  // bar,
  barIndex,
  bars,
  setBarsData,
  setUpdateBarsData,
  setHoveringOverRow,
  rowsRef,
  addSubColRef,
  mediaParentRef,
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

  // const zoomBar = zoomBarsMap.get(bar?.id);
  // width = zoomBar?.width || bar?.width; // bar.width and lp are from barsdata hook
  // left_position = zoomBar?.left_position || bar?.left_position;

  const allBars = barsData?.sub_columns.flatMap((row) => row.bars) || [];

  // in the returned array first arg are spring values, second arg is api which control these spring
  // usespring hook takes either config or function, here using function
  const [springs, api] = useSprings(
    allBars.length || 0,
    (i) => ({
      barID: allBars[i].id,
      subColId: allBars[i].sub_col_id,
      clipTop: 0,
      clipLP: allBars[i].left_position || 0, // initial lp
      clipWidth: allBars[i].width || 0, // initial width
      zIndex: 1,
      config: { tension: 300, friction: 30 }, // smooth animation
      immediate: true,
    }),
    []
  );

  useEffect(() => {
    console.log("bars", bars);
    console.log("allbars", allBars);
  }, []);

  useEffect(() => {
    console.log("bars.lengthin use spring", allBars.length);
    console.log(
      "Springs array:",
      springs.map((s, i) => ({
        index: i,
        barID: s.barID?.get(),
        subColId: s.subColId?.get(),
        clipLP: s.clipLP.get(),
        clipWidth: s.clipWidth.get(),
      }))
    );
  }, [springs]);

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
      // console.log("barsdatachangeafterzoom in updatebarafterresize", barsData);
      // console.log("newleft position bro", newLeftPosition);
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
        // console.log("barsdata before updating it", barsData);
        // console.log("updatedbar  data", updatebar.data[0]);
        setBarsData(updatebar.data[0]);
        setUpdateBarsData(true);
      }
      return subcol;
    });
  };

  const updateBarRow = async (
    dropBarId: number,
    rowId: number,
    updatedBarRes: bar
  ) => {
    try {
      console.log("row id hovered", rowId);
      const addBarResponse = await axios.patch(
        // sub-columns/:id - patch in backend
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${rowId}`,
        {
          addBarData: { ...updatedBarRes }, // add bar to dropped subcol
          barIndex, // For positioning bars in subcol based upon order values
        }
      );
      setUpdateBarsData(true);
    } catch (error) {}
  };

  const updateBarLPAfterDrop = async (
    barId: number,
    newLeftPosition: number,
    hoveredRowId: string
  ) => {
    const NumHovRowId = Number(hoveredRowId);
    barsData?.sub_columns?.map(async (subcol) => {
      const targetBar = subcol.bars?.find((b) => b.id === barId);
      if (targetBar) {
        const updatebar = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/bars/${targetBar.id}`,
          {
            ...targetBar,
            left_position: newLeftPosition,
          }
        );
        const updatedLPRes = updatebar.data[0];
        console.log("updatebarlp AFTER DROP", updatedLPRes);
        const updatedBarRes = updatedLPRes.sub_columns
          .flatMap((row: any) => (row.bars ? row.bars : []))
          .find((bar: bar) => bar.id === targetBar.id);

        console.log("updatebar RES BRO", updatedBarRes);
        setBarsData(updatebar.data[0]);
        updateBarRow(targetBar.id, NumHovRowId, updatedBarRes);
      }
    });
  };

  const getRows = () => {
    if (!rowsRef.current) return [];

    return rowsRef.current
      .map((row) => {
        if (!row) return null; // Skip if ref is null
        const rect = row.getBoundingClientRect();
        return { id: row.dataset.rowId, top: rect.top, bottom: rect.bottom };
      })
      .filter(Boolean) as { id: string; top: number; bottom: number }[]; // Ensure proper type
  };

  const getRowUnderCursor = (event: MouseEvent): string | null => {
    const rows = getRows();
    const mouseY = event.clientY;
    const row = rows.find((r) => mouseY >= r.top && mouseY <= r.bottom);
    console.log("rows", rows);
    console.log("mouseY", mouseY);
    console.log("row", row);
    return row ? row.id : null;
  };

  const fetchClipsOnHover = (rowId: string | null) => {
    const NumRowId = Number(rowId);
    const clipsInRow = barsData?.sub_columns.filter(
      (subCol) => subCol.sub_col_id === NumRowId
    );
    console.log("WHOLE ROW", clipsInRow);
    return clipsInRow;
  };

  // use gesture and spring
  const bindDrag = useDrag(
    ({
      movement: [dx, dy],
      args: [barId, rowId],
      event,
      last,
      down,
      active,
    }) => {
      if (event.target && (event.target as HTMLElement).closest(".handle"))
        // if the target element or its ancestors contain handle class than stop
        return;

      let isOverRow = false;
      let clientY = 0;

      if ("clientY" in event) {
        clientY = event.clientY;
      } else if ("touches" in event && event.touches.length > 0) {
        clientY = event.touches[0].clientY;
      }

      barsData?.sub_columns?.forEach((subColumn) => {
        subColumn?.bars?.forEach((bar, barIndex) => {
          if (bar.id !== barId.get()) return {};

          // for clip movement within the subcol(row)
          const minX = 0;
          const maxX = mediaContainerWidth - bar.width; // prevent going beyond right edge
          const newX = Math.max(minX, Math.min(bar.left_position + dx, maxX));

          // for clip movement between the subcol(row)
          const verticalThreshold = 25;
          const threshold_condition = Math.abs(dy) > verticalThreshold;
          let newY: number;

          if (threshold_condition) {
            newY = last ? 0 : dy;
            console.log("newx bro", newX);
          }

          console.log("BAR DRAGGED ID", barId.get(), bar.id);
          if (active) {
            const hoveredRowId = getRowUnderCursor(event as PointerEvent);

            //fetch clips from hovered row
            fetchClipsOnHover(hoveredRowId);
            // clipsInRow?.map((clips) => {
            //   clips.bars.forEach((bar) => {
            //     if (newX <= bar.left_position) {
            //       console.log("BAR.LEF", bar.left_position);
            //     } else if (newX >= bar.left_position) {
            //     }
            //   });
            // });
          }
          console.log("down or what", down);

          api.start((i) => {
            if (allBars[i].id !== barId.get()) return {};
            return {
              clipTop: newY,
              clipLP: threshold_condition
                ? down
                  ? newX
                  : bar.left_position
                : newX,
              zIndex: down ? 49 : 1,
              immediate: down,
            };
          });
          if (last) {
            api.start({ zIndex: 1, clipTop: 0 });
            // if (targetRow && targetRow.id !== currentRowId) {
            //   moveClipToNewRow(bar, currentRowId, targetRow.id);
            // }

            if (Math.abs(dy) < verticalThreshold) {
              // only update(lp of clip) for drag within the subcol
              updateBarAfterResize(
                bar,
                subColumn.bars,
                barIndex,
                bar.width,
                newX
              );
            } else if (Math.abs(dy) > verticalThreshold) {
              // for dragged bar bw the subcol
              // updateBarAfterDragging(bar, newX); // todo: rather than updating, add new row below or above and add the newlp to the dragged bar and place it in new row

              const hoveredRowId = getRowUnderCursor(event as PointerEvent);
              const clipsInRow = fetchClipsOnHover(hoveredRowId);
              clipsInRow?.map((clips) => {
                if (hoveredRowId) {
                  clips.bars.forEach((bar) => {
                    if (newX <= bar.left_position) {
                      console.log("BAR.LEF, newx", bar.left_position, newX);
                      updateBarLPAfterDrop(barId.get(), newX, hoveredRowId);
                    } else if (newX >= bar.left_position) {
                      const newLp = bar.left_position + bar.width;
                      updateBarLPAfterDrop(barId.get(), newLp, hoveredRowId);
                    }
                  });
                }
              });
            }
          }
        });
      });
      console.log("is over row ", isOverRow);
      setHoveringOverRow(isOverRow);
    }
  );

  const bindLeftResize = useDrag(
    ({ movement: [dx], args: [barId], last }) => {
      barsData?.sub_columns?.forEach((subColumn) => {
        subColumn?.bars?.forEach((bar, barIndex) => {
          if (bar.id !== barId.get()) return;
          console.log("bar.id , barid ", bar.id, barId.get());
          const newWidth = Math.max(minWidth, bar.width - dx);
          let newX = Math.min(
            bar.left_position + dx,
            bar.left_position + bar.width - minWidth
          );

          if (newX <= 0) newX = bar.left_position;

          api.start((i) => {
            if (allBars[i].id !== barId.get()) return {};
            return {
              clipLP: newX,
              clipWidth: newWidth,
              immediate: true,
            };
          });

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
      barsData?.sub_columns?.forEach((subColumn) => {
        subColumn?.bars?.forEach((bar, barIndex) => {
          if (bar.id !== barId.get()) return {};
          console.log("bar.,id , barid", bar.id, barId.get());
          const newWidth = Math.max(
            minWidth,
            Math.min(bar.width + dx, mediaContainerWidth - bar.left_position)
          );
          api.start((i) => {
            if (allBars[i].id !== barId.get()) return {};
            return { clipWidth: newWidth, immediate: true };
          });
          if (last) {
            updateBarAfterResize(
              bar,
              bars,
              barIndex,
              newWidth,
              bar.left_position
            );
          }
        });
      });
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
      {item.bars.map((bar: bar, index: number, bars: bar[]) => {
        const spring = springs.find((s) => s.barID.get() === bar.id);
        return (
          <animated.div
            key={index}
            {...bindDrag(spring?.barID, item.sub_col_id)}
            className={styles.item_box_div}
            style={{
              // width: width, // width according to stored in db and zoom level
              // left: left_position,
              width: spring?.clipWidth.to((w) => `${w}px`),
              transform: spring?.clipLP.to((xVal) => `translate(${xVal}px`),
              top: springs[index].clipTop.to((yVal) => `${yVal}px`),
              zIndex: springs[index].zIndex.to((z) => `${z}`),
              touchAction: "none",
            }}
            id={`bar-${bar?.id}`}
            onContextMenu={(e) =>
              handleRightClickBar(e, bar, bar?.id, item?.id)
            } // here we are passing bar info
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
              {bar?.width > 125 && (
                <div className={styles.bar_content}>
                  {barsData?.sub_columns?.length ? (
                    <div
                      {...bindLeftResize(spring?.barID)}
                      className={`${styles.bar_arrow_div} hidden group-hover:flex handle`}
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

                  {bar.width >= 300 && (
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
                      {...bindRightResize(spring?.barID)}
                      className={`${styles.bar_arrow_div} hidden group-hover:flex handle`}
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
        );
      })}

      {item.bars.map(
        (bar: bar, index) =>
          contextMenu.visible &&
          contextMenu.id === bar?.id && (
            <ContextMenu
              index={index}
              x={contextMenu.x}
              y={contextMenu.y}
              id={contextMenu.id}
              options={options}
              onOptionClick={handleOptionClick}
              visible={contextMenu.visible}
            />
          )
      )}
    </div>
  );
};

export default Clip;
