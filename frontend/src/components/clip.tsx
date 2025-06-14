import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "@/styles/timeline.module.css";
import { BarsProp, sub_column, bar } from "@/interfaces/barsProp";
import axios from "axios";
import ContextMenu from "./contextMenu";
import { animated, SpringRef, SpringValue } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useSprings } from "@react-spring/web";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  id: number | null;
}

type SpringType = {
  // barID: SpringValue<number>;
  subColId: SpringValue<number>;
  clipTop: SpringValue<number>;
  clipLP: SpringValue<number>;
  clipWidth: SpringValue<number>;
  zIndex: SpringValue<number>;
};

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
  prjId: string;
  zoomSprings: SpringType[];
  zoomApi: SpringRef<{
    // barID: number;
    subColId: number;
    clipTop: number;
    clipLP: number;
    clipWidth: number;
    zIndex: number;
  }>;
  zoomAllBars: bar[];
  totalDuration: number;
  setBarAfterShift: React.Dispatch<React.SetStateAction<boolean>>;
  barIdsRef: React.MutableRefObject<number[]>;
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
  prjId,
  zoomSprings,
  zoomApi,
  zoomAllBars,
  totalDuration,
  setBarAfterShift,
  barIdsRef,
}) => {
  //state hooks
  const [options, setOptions] = useState<
    { label: string; action: () => void }[]
  >([]);
  const [delBarFromRow, setDelBarFromRow] = useState<bar>();

  // redux hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  const lastNewWidthLeftRef = useRef<number | null>(null);
  const lastNewWidthRightRef = useRef<number | null>(null);

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
  // const [springs, api] = useSprings(
  //   allBars.length || 0,
  //   (i) => ({
  //     barID: allBars[i].id,
  //     subColId: allBars[i].sub_col_id,
  //     clipTop: 0,
  //     clipLP: allBars[i].left_position || 0, // initial lp
  //     clipWidth: allBars[i].width || 0, // initial width
  //     zIndex: 1,
  //     config: { tension: 300, friction: 30 }, // smooth animation
  //     immediate: true,
  //   }),
  //   []
  // );

  // useEffect(() => {
  //   console.log(
  //     "Springs array:",
  //     springs.map((s, i) => ({
  //       index: i,
  //       barID: s.barID?.get(),
  //       subColId: s.subColId?.get(),
  //       clipLP: s.clipLP.get(),
  //       clipWidth: s.clipWidth.get(),
  //     }))
  //   );
  // }, [springs]);

  useEffect(() => {
    console.log(
      "ZOOM Springs array:",
      zoomSprings.map((s, i) => ({
        index: i,
        // barID: s.barID?.get(),
        subColId: s.subColId?.get(),
        clipLP: s.clipLP.get(),
        clipWidth: s.clipWidth.get(),
      }))
    );
  }, [zoomSprings]);

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
      // console.log("gap res", gap.data[0]);
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
    newLeftPosition: number,
    rulerStartTimePxVal: number,
    rulerStartTimeInSec: number,
    resizeHandle?: string, // option since not needed for bindDrag
    predictedEndTime?: number, // taking from bindRightResize only
    predictedStartTime?: number
  ) => {
    barsDataChangeAfterZoom?.sub_columns?.map(async (subcol) => {
      const targetBar = subcol.bars?.find((b) => b.id === bar.id);

      const visibleDuration = bar.duration - bar.start_time;
      const singleTickPxValue = mediaContainerWidth / totalDuration;

      const trimFromLeftPx = newLeftPosition - bar.left_position;
      const startTrimSec =
        (trimFromLeftPx / singleTickPxValue) * markerInterval;

      const startTimeVal =
        predictedStartTime && predictedStartTime < 0
          ? 0
          : bar.start_time + startTrimSec;
      const startTime = resizeHandle === "left" ? startTimeVal : bar.start_time;

      const endTimeTrimValue =
        resizeHandle === "right"
          ? visibleDuration - (newWidth / singleTickPxValue) * markerInterval
          : 0; // no changes should happen to end_time if using left handle

      const endTimeVal =
        predictedEndTime && predictedEndTime > bar.duration
          ? 0
          : endTimeTrimValue;

      const endTimeAfterTrim =
        resizeHandle === "right"
          ? bar.duration - endTimeVal
          : bar.end_time - endTimeTrimValue;

      if (targetBar) {
        const updatebar = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/bars/${targetBar.id}`,
          {
            ...bar,
            left_position: newLeftPosition,
            width: newWidth,
            start_time: startTime,
            end_time: endTimeAfterTrim,
            clip_duration: parseFloat(
              (endTimeAfterTrim - startTime).toFixed(2)
            ),
            ruler_start_time: rulerStartTimePxVal,
            ruler_start_time_in_sec: rulerStartTimeInSec,
          }
        );
        await calculateGap(subcol, bar, bars, barIndex);
        console.log("updatedbar  data", updatebar.data);
        const filteredData = updatebar.data.filter(
          (bar: BarsProp) => bar.project_id === Number(prjId)
        );
        console.log("filtered data check in here", filteredData[0]);
        const updatedData = filteredData[0];
        setBarsDataChangeAfterZoom(updatedData);
        setBarsData(updatedData);
        setUpdateBarsData(true);
      }
      return subcol;
    });
  };

  const shiftBarsAfterDrop = async (
    data: BarsProp,
    droppedBarId: number | undefined,
    hoveredRowId?: number
  ) => {
    try {
      await Promise.all(
        data.sub_columns?.map(async (subcol) => {
          // const droppedBar = subcol.bars?.find((b) => b.id === droppedBarId); // fetching all bars except dropped one

          const clonedSubCol = structuredClone(subcol);
          const droppedBar = clonedSubCol.bars?.find(
            (b) => b.id === droppedBarId
          );

          if (!droppedBar) return;
          console.log("dropped bar checko", droppedBar);
          const barsPresentAfterDroppedBar = subcol.bars
            .filter((bar) => bar.left_position > droppedBar.left_position)
            .sort((a, b) => a.left_position - b.left_position);

          const barsPresentBeforeDroppedBar = subcol.bars.filter(
            (bar) => bar.left_position < droppedBar.left_position
          );

          if (!barsPresentAfterDroppedBar) return;

          for (let i = 0; i < barsPresentAfterDroppedBar.length; i++) {
            const curr = barsPresentAfterDroppedBar[i];
            const minLeft =
              i === 0
                ? droppedBar.left_position + droppedBar.width
                : barsPresentAfterDroppedBar[i - 1].left_position +
                  barsPresentAfterDroppedBar[i - 1].width;

            if (curr.left_position < minLeft) {
              curr.left_position = minLeft; // shift to right of previous bar
            }
          }

          const updatedBars = [
            ...barsPresentBeforeDroppedBar.map((bar) => ({ ...bar })),
            { ...droppedBar },
            ...barsPresentAfterDroppedBar.map((bar) => ({ ...bar })),
          ];

          console.log("updated bars", updatedBars);
          console.log("data", data);
          const updatedData = await axios.patch(
            // sub-columns/:id - patch in backend
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/updateBar/${hoveredRowId}`,
            {
              addBarData: { ...updatedBars },
            }
          );
          console.log("updated data.data", updatedData.data[0]);
          const getUpdatedData = updatedData.data[0];
          setBarsDataChangeAfterZoom(getUpdatedData);
          setBarsData(getUpdatedData);
          setBarAfterShift(true);
        })
      );
    } catch (error) {
      console.error("Error in shiftBarsAfterDrop:", error);
    }
  };

  // it adds dragged bar to the row where it has been dropped
  const updateBarRow = async (rowId: number, updatedBarRes: bar) => {
    try {
      console.log("getting UPDATED BAR RES", updatedBarRes);
      const afterAddingBar = await axios.patch(
        // sub-columns/:id - patch in backend
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${rowId}`,
        {
          addBarData: { ...updatedBarRes }, // add bar to dropped subcol
        }
      );
      console.log("after adding bar", afterAddingBar.data);
      delCmBarId(delBarFromRow?.sub_col_id, delBarFromRow?.id, rowId); // delete dragged bar from its row
    } catch (error) {
      console.error("Error in updateBarRow:", error);
    }
  };

  // updatebarlpafterdrop update lp, subcolid of dragged bar
  const updateBarLPAfterDrop = async (
    barId: number,
    newLeftPosition: number,
    hoveredRowId: string,
    rulerStartTimePxVal: number,
    pxToTime: number
  ) => {
    const NumHovRowId = Number(hoveredRowId);
    barsDataChangeAfterZoom?.sub_columns?.map(async (subcol) => {
      const targetBar = subcol.bars?.find((b) => b.id === barId); // fetching dragged bar here
      if (targetBar) {
        const updatebar = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/bars/${targetBar.id}`,
          {
            ...targetBar,
            left_position: newLeftPosition,
            sub_col_id: NumHovRowId,
            ruler_start_time: rulerStartTimePxVal,
            ruler_start_time_in_sec: pxToTime,
          }
        );
        const filteredData = updatebar.data.filter(
          (bar: BarsProp) => bar.project_id === Number(prjId)
        );
        const updatedBarRes = filteredData[0].sub_columns
          .flatMap((subcol: any) => (subcol.bars ? subcol.bars : []))
          .find((bar: bar) => bar.id === targetBar.id);
        console.log("updatebar RES BRO", updatedBarRes);
        console.log("filtered data CHECK HERE AB", filteredData);
        // setBarsDataChangeAfterZoom(filteredData);
        updateBarRow(NumHovRowId, updatedBarRes);
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
    return row ? row.id : null;
  };

  const fetchClipsOnHover = (rowId: string | null) => {
    const NumRowId = Number(rowId);
    const clipsInRow = barsData?.sub_columns.filter(
      (subCol) => subCol.sub_col_id === NumRowId
    );
    return clipsInRow;
  };

  // use gesture and spring
  const bindDrag = useDrag(
    ({ movement: [dx, dy], args: [barId], event, last, down, active }) => {
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
      barsDataChangeAfterZoom?.sub_columns?.forEach((subColumn) => {
        subColumn?.bars?.forEach((bar, barIndex) => {
          if (bar.id !== barId) return {};
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
          }
          const hoveredRowId = getRowUnderCursor(event as PointerEvent);

          const rulerStartTimePxVal = Math.max(0, bar.left_position + dx);

          const singleTickPxValue = mediaContainerWidth / totalDuration;
          const pxPerSecond = singleTickPxValue / markerInterval;
          const pxToTime = rulerStartTimePxVal / pxPerSecond;

          setDelBarFromRow(bar);
          if (active) {
            //fetch clips from hovered row
            fetchClipsOnHover(hoveredRowId);
          }

          let resolvedX = newX;

          const barIndexMap = new Map(
            barIdsRef.current.map((id, idx) => [id, idx])
          );
          const getBarIndex = barIndexMap.get(barId);

          if (getBarIndex != undefined) {
            zoomApi.start((i) => {
              if (i !== getBarIndex) return {};
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
          }

          if (last) {
            zoomApi.start((i) => {
              if (allBars[i].id !== barId) return {};
              return { zIndex: 1, clipTop: 0 };
            });
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
                newX,
                rulerStartTimePxVal,
                pxToTime
              );
              console.log("newx in < vertical", newX);
            } else if (Math.abs(dy) > verticalThreshold) {
              // for dragged bar bw the subcol
              const clipsInRow = fetchClipsOnHover(hoveredRowId);
              console.log("clips in row ", clipsInRow);
              clipsInRow?.map((clips) => {
                if (hoveredRowId) {
                  const firstBarLp = clips.bars[0]?.left_position;
                  const lastBar = clips.bars?.length - 1;
                  const lastBarLp = clips.bars[lastBar]?.left_position;
                  const lastBarWidth = clips.bars[lastBar]?.width;

                  clips.bars.forEach((bar) => {
                    const start = bar.left_position;
                    const end = bar.left_position + bar.width;

                    if (newX <= firstBarLp) {
                      console.log("newx, barlp 1", newX, bar.left_position);
                      resolvedX = newX;
                      updateBarLPAfterDrop(
                        barId,
                        resolvedX,
                        hoveredRowId,
                        rulerStartTimePxVal,
                        pxToTime
                      );
                      console.log("before first clips ran");
                    }

                    for (let i = 0; i < clips.bars.length - 1; i++) {
                      const current = clips.bars[i];
                      const next = clips.bars[i + 1];

                      const currentEnd = current.left_position + current.width;
                      const nextStart = next.left_position;

                      if (newX > currentEnd && newX < nextStart) {
                        // newX fits between current and next clip
                        resolvedX = newX;
                        updateBarLPAfterDrop(
                          barId,
                          resolvedX,
                          hoveredRowId,
                          rulerStartTimePxVal,
                          pxToTime
                        );
                        console.log(
                          "bw clips ran, currentend, nextstart, newx",
                          currentEnd,
                          nextStart,
                          newX
                        );
                        break;
                      }
                    }

                    if (newX >= start && newX <= end) {
                      // this condition is when dragged bar is above the bar present in the hovered subcol
                      resolvedX = bar.left_position + bar.width;
                      updateBarLPAfterDrop(
                        barId,
                        resolvedX,
                        hoveredRowId,
                        rulerStartTimePxVal,
                        pxToTime
                      );
                      // console.log("newx, barlp 3", newX, bar.left_position);
                      console.log("start, end , newx", start, end, newX);
                      console.log("on hov clips ran");
                    }
                    if (newX >= lastBarLp + lastBarWidth) {
                      resolvedX = newX;
                      updateBarLPAfterDrop(
                        barId,
                        resolvedX,
                        hoveredRowId,
                        rulerStartTimePxVal,
                        pxToTime
                      );
                      console.log(
                        "after last clips ran, newx, lastbarlp + lastbarwidth",
                        newX,
                        lastBarLp + lastBarWidth
                      );
                      console.log("px to time", pxToTime);
                    }
                  });

                  // when row is empty
                  // updateBarLPAfterDrop(barId, resolvedX, hoveredRowId);
                }
              });
            }

            zoomApi.start((i) => {
              if (i !== getBarIndex) return {};
              return {
                clipLP: hoveredRowId
                  ? resolvedX
                  : threshold_condition
                  ? down
                    ? resolvedX
                    : bar.left_position
                  : resolvedX,
                zIndex: 1,
                immediate: false,
              };
            });
          }
        });
      });
      setHoveringOverRow(isOverRow);
    }
  );

  const bindLeftResize = useDrag(
    ({ movement: [dx], args: [barId, subColId], last }) => {
      let newX: number;
      barsDataChangeAfterZoom?.sub_columns?.forEach((subColumn) => {
        subColumn?.bars?.forEach((bar, barIndex, bars) => {
          if (bar.id !== barId) return;
          const duration = bar.duration || 0; // zero probly for img media
          const singleTickPxValue = mediaContainerWidth / totalDuration; // equal px value for each marker
          const width = Math.round(
            (duration / markerInterval) * singleTickPxValue
          );

          const trimmedPixels = dx; // dx is negative when dragging left
          console.log("trimmed px", trimmedPixels);
          const trimmedSeconds =
            (trimmedPixels / singleTickPxValue) * markerInterval;
          const predictedStartTime = bar.start_time + trimmedSeconds;

          const rulerStartTimePxVal = Math.max(0, bar.left_position + dx);
          const pxPerSecond = singleTickPxValue / markerInterval;
          const pxToTime = rulerStartTimePxVal / pxPerSecond;

          const minWidth = width * 0.1;
          let newWidth = Math.max(minWidth, Math.min(bar.width - dx, width));
          console.log(
            "minwidth",
            minWidth,
            "bar.width , dx, width",
            bar.width,
            dx,
            width
          );

          if (subColId === bar.sub_col_id) {
            if (bar.order === 0 && barIndex === 0) {
              console.log("preidct start", predictedStartTime);
              if (predictedStartTime >= 0) {
                console.log("GREATER THAN 0 RUN");
                newX =
                  newWidth >= width
                    ? Math.max(
                        bar.left_position + dx,
                        bar.left_position + bar.width - newWidth
                      )
                    : Math.min(
                        bar.left_position + dx,
                        bar.left_position + bar.width - newWidth
                      ); // both args value will be same until the handle reach its minwidth

                // For the first bar, set left limit and stop increasing width
                if (newX <= 0) {
                  const minLeft = 0; // Prevent moving beyond left limit
                  newX = Math.max(newX, minLeft); // Set minimum left position
                  newWidth = bar.width - (minLeft - bar.left_position);
                }
                lastNewWidthLeftRef.current = newWidth;
                console.log("newx and new width", newX, newWidth);
              } else if (predictedStartTime <= -1) {
                console.log("LESS THAN 0 RUN");
                console.log("predcistart TIME", predictedStartTime);

                // newWidth = Math.max(
                //   minWidth,
                //   Math.min(newWidth - dx, bar.width) // bar.width will be min in here
                // );

                newWidth = lastNewWidthLeftRef.current ?? newWidth;
                console.log("newwidth LAST NEW WIDTH", newWidth);
                newX = Math.max(
                  bar.left_position + dx,
                  bar.left_position + bar.width - newWidth // this will be max in here
                );
              }
            } else {
              const filteredBars = bars.filter(
                (filterBar) => filterBar.order < bar.order
              );
              const prevBar = filteredBars[filteredBars.length - 1];
              console.log("filtered bar", prevBar);
              const minPosition = prevBar.left_position + prevBar.width + 2;
              console.log("minpos", minPosition);

              let calcNewX =
                newWidth >= width
                  ? Math.max(
                      bar.left_position + dx,
                      bar.left_position + bar.width - newWidth
                    )
                  : Math.min(
                      bar.left_position + dx,
                      bar.left_position + bar.width - newWidth
                    );

              let calcMinNewX = Math.max(calcNewX, minPosition);

              if (calcMinNewX === minPosition) {
                newX = calcMinNewX;
                newWidth = bar.width - (minPosition - bar.left_position);
              } else {
                newX = calcNewX;
              }
            }
          }

          zoomApi.start((i) => {
            if (allBars[i].id !== barId) return {};
            return {
              clipLP: newX,
              clipWidth: newWidth,
              immediate: true,
            };
          });

          if (last) {
            updateBarAfterResize(
              bar,
              subColumn.bars,
              barIndex,
              newWidth,
              newX,
              rulerStartTimePxVal,
              pxToTime,
              "left",
              undefined, // for predictedEndTime
              predictedStartTime
            );
          }
        });
      });
    },
    { axis: "x" }
  );

  const bindRightResize = useDrag(
    ({ movement: [dx], args: [barId, subColId], last }) => {
      barsDataChangeAfterZoom?.sub_columns?.forEach((subColumn) => {
        let newWidth: number;
        subColumn?.bars?.forEach((bar, barIndex) => {
          const singleTickPxValue = mediaContainerWidth / totalDuration; // equal px value for each marker
          const trimmedPixels = dx; // dx is negative when dragging left
          const trimmedSeconds =
            (trimmedPixels / singleTickPxValue) * markerInterval;
          const predictedEndTime = bar.end_time + trimmedSeconds;

          if (bar.id !== barId) return {};
          const duration = bar.duration || 0; // zero probly for img
          const visibleDuration = duration - bar.start_time;
          const width = (visibleDuration / markerInterval) * singleTickPxValue;

          const rulerStartTimePxVal = Math.max(0, bar.left_position + dx);
          const pxPerSecond = singleTickPxValue / markerInterval;
          const pxToTime = rulerStartTimePxVal / pxPerSecond;

          const minWidth = width * 0.1;
          if (subColId === bar.sub_col_id) {
            const rowBars = subColumn.bars;
            // console.log("subcol.bars ", rowBars); // all bars

            // console.log("trimmed seconds ", trimmedSeconds);
            // console.log("predic end time", predictedEndTime);

            if (predictedEndTime <= bar.duration) {
              console.log("predict end time < THAN DURATION", predictedEndTime);
              console.log(
                "bar.end time, trimmed seconds, dx",
                bar.end_time,
                trimmedSeconds,
                dx
              );
              subColumn.bars.forEach((bar, index, bars) => {
                newWidth = Math.max(minWidth, Math.min(bar.width + dx, width));
                console.log(
                  "minwidth, bar.width, dx, width",
                  minWidth,
                  bar.width,
                  dx,
                  width
                );
                lastNewWidthRightRef.current = newWidth;
                console.log("newwidth in < than", newWidth);

                for (let i = index + 1; i < rowBars.length; i++) {
                  const nextBar = bars[i];
                  const maxRightPosition = nextBar.left_position - 2;
                  // console.log("new width , barlp", newWidth, bar.left_position);
                  if (newWidth + bar.left_position > maxRightPosition) {
                    // console.log("max r pos.", maxRightPosition);
                    // console.log("bars[i], CHECK THIS OUT BRO", bars[i]);
                    newWidth = maxRightPosition - bar.left_position - 2;
                  }
                }
              });
            } else if (predictedEndTime > bar.duration) {
              console.log("predict end time > THAN DURATION", predictedEndTime);
              newWidth = lastNewWidthRightRef.current ?? bar.width; // bar.width in case newWidth is undefined
              console.log(
                "lastnewwidth REF, newidth, bar.width BABE",
                lastNewWidthRightRef.current,
                newWidth,
                bar.width
              );
            }
          }

          zoomApi.start((i) => {
            if (allBars[i].id !== barId) return {};
            return { clipWidth: newWidth, immediate: true };
          });
          if (last) {
            updateBarAfterResize(
              bar,
              bars,
              barIndex,
              newWidth,
              bar.left_position,
              rulerStartTimePxVal,
              pxToTime,
              "right",
              predictedEndTime,
              undefined // for predictedStartTime
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

  // it deletes the bar from the dragged subcol
  const delCmBarId = async (
    cmSubColId: number | undefined,
    cmBarId: number | undefined,
    hoveredRowId?: number
  ) => {
    console.log("cmsubcolid, bar id,", cmSubColId, cmBarId);
    try {
      const delBar = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${cmSubColId}/bars/${cmBarId}`
      );

      const filteredData = delBar.data.filter(
        (bar: BarsProp) => bar.project_id === Number(prjId)
      );
      const updatedRow = filteredData[0];
      console.log("updated row bro after delcmbarid", updatedRow);
      // setBarsDataChangeAfterZoom(updatedRow);
      // setFetchBars(true);
      shiftBarsAfterDrop(updatedRow, cmBarId, hoveredRowId);
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
      { label: "edit", action: () => console.log(`Edit ${bar.id}`) },
      { label: "delete", action: () => delCmBarId(subColId, bar.id) },
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
      {item.bars.map((bar: bar, index: number) => {
        // const spring = springs.find((s) => s.barID?.get() === bar.id);
        // const zoomSpring = zoomSprings.find((s) => s.barID?.get() === bar.id);
        // const clipWidthValue = zoomSpring?.clipWidth.get();

        const barIndex = barIdsRef.current.findIndex(
          (id: any) => id === bar.id
        );
        const zoomSpring = zoomSprings[barIndex];

        return (
          <animated.div
            key={bar.id}
            {...bindDrag(bar.id)}
            className={styles.item_box_div}
            style={{
              width: zoomSpring?.clipWidth.to((w) => `${w}px`),
              transform: zoomSpring?.clipLP.to((xVal) => `translate(${xVal}px`),
              top: zoomSpring?.clipTop.to((yVal) => `${yVal}px`),
              zIndex: zoomSpring?.zIndex.to((z) => `${z}`),
              touchAction: "none",
            }}
            id={`bar-${bar?.id}`}
            onContextMenu={(e) =>
              handleRightClickBar(e, bar, bar?.id, item?.sub_col_id)
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
              <div className={styles.bar_content}>
                {barsData?.sub_columns?.length ? (
                  <div
                    {...bindLeftResize(bar.id, bar.sub_col_id)}
                    className={`${
                      bar.width <= 125
                        ? styles.sm_bar_arrow_div
                        : styles.bar_arrow_div
                    } flex group-hover:w-[3.5rem] handle`}
                    style={{
                      touchAction: "none",
                    }}
                  >
                    {bar.width >= 125 && (
                      <div
                        className={`${
                          bar.width <= 125
                            ? styles.sm_bar_arrow_left
                            : styles.bar_arrow_left
                        } flex group-hover:hidden`}
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
                    )}
                  </div>
                ) : null}

                {bar.width >= 300 && (
                  <div className={styles.clip_center}>
                    <div
                      className={`${styles.m_type_label} flex group-hover:hidden`}
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
                    {...bindRightResize(bar.id, bar.sub_col_id)}
                    className={`${
                      bar.width <= 125
                        ? styles.sm_bar_arrow_div
                        : styles.bar_arrow_div
                    } flex group-hover:w-[3.5rem] handle`}
                    style={{
                      touchAction: "none",
                    }}
                  >
                    {bar.width >= 125 && (
                      <div
                        className={`${
                          bar.width <= 125
                            ? styles.sm_bar_arrow_left
                            : styles.bar_arrow_right
                        } flex group-hover:hidden`}
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
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </animated.div>
        );
      })}

      {item.bars.map((bar: bar, index) => (
        <div key={index}>
          {contextMenu.visible && contextMenu.id === bar?.id && (
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
      ))}
    </div>
  );
};

export default Clip;
