import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "@/styles/timeline.module.css";
import { BarsProp, sub_column, bar, gap } from "@/interfaces/barsProp";
import axios from "axios";
import ContextMenu from "./contextMenu";
import { animated, SpringRef, SpringValue } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
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
  barsDataChangeAfterZoom: BarsProp | null;
  setBarsDataChangeAfterZoom: React.Dispatch<
    React.SetStateAction<BarsProp | null>
  >;
  barsData: BarsProp | null;
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  mediaContainerWidth: number;
  setFetchBars: React.Dispatch<React.SetStateAction<boolean>>;
  barIndex: number;
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
  totalDuration: number;
  setBarAfterShift: React.Dispatch<React.SetStateAction<boolean>>;
  barIdsRef: React.MutableRefObject<number[]>;
}
const Clip: React.FC<ClipProps> = ({
  item,
  barsDataChangeAfterZoom,
  setBarsDataChangeAfterZoom,
  barsData,
  contextMenu,
  setContextMenu,
  mediaContainerWidth,
  setFetchBars,
  barIndex,
  setBarsData,
  setUpdateBarsData,
  setHoveringOverRow,
  rowsRef,
  addSubColRef,
  mediaParentRef,
  prjId,
  zoomSprings,
  zoomApi,
  totalDuration,
  setBarAfterShift,
  barIdsRef,
}) => {
  //state hooks
  const [options, setOptions] = useState<
    { label: string; action: () => void }[]
  >([]);
  const [delBarFromRow, setDelBarFromRow] = useState<bar>();
  const [delGapFromRow, setDelGapFromRow] = useState<gap>();

  // redux hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  const lastNewWidthLeftRef = useRef<number | null>(null);
  const lastNewWidthRightRef = useRef<number | null>(null);

  const icons: { [key: string]: string } = {
    audio: "/audio.png",
    video: "/video.png",
  };

  const allBars = barsData?.sub_columns.flatMap((row) => row.bars) || [];

  const handleGap = async (
    subCol: sub_column,
    barId: number,
    gapWidth: number,
    startOfGap: number,
    endOfGap: number
  ) => {
    try {
      const gapToUpdate = subCol.gaps.find((g) => g.barId === barId);
      const handleGapRes = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/gaps/update/${prjId}/${gapToUpdate?.id}`,
        {
          ...gapToUpdate,
          width: gapWidth,
          start_gap: startOfGap,
          end_gap: endOfGap,
        }
      );
      const gapUpdated = handleGapRes.data;
      setBarsDataChangeAfterZoom(gapUpdated);
      console.log("handle gap res", handleGapRes.data);
    } catch (error) {
      console.error("Error updating gap:", error);
    }
  };

  const calculateGap = async (
    subcol: sub_column,
    bar: bar,
    bars: bar[],
    barIndex: number,
    newLP: number,
    newWidth: number
  ) => {
    // calc for first bar clip in the subcol
    if (bar.order === 0) {
      const startOfGap = 0;
      const endOfGap = newLP;
      const gapWidth = newLP; // lp of bar would be the end position of gap
      await handleGap(subcol, bar.id, gapWidth, startOfGap, endOfGap);
    }
    // calc for bars clip placed next to first
    else {
      const prevBar = bars[barIndex - 1];

      const startOfGap = prevBar ? prevBar.left_position + prevBar.width : 0;
      const endOfGap = newLP;
      const gapWidth = endOfGap - startOfGap;
      await handleGap(subcol, bar.id, gapWidth, startOfGap, endOfGap);
    }

    // update gap present after dragged/resized bar (i.e., for next bar)
    const nextBar = bars[barIndex + 1];
    if (nextBar) {
      const startOfGap = newLP + newWidth;
      const endOfGap = nextBar.left_position;
      const gapWidth = endOfGap - startOfGap;
      await handleGap(subcol, nextBar.id, gapWidth, startOfGap, endOfGap);
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
        await calculateGap(
          subcol,
          bar,
          bars,
          barIndex,
          newLeftPosition,
          newWidth
        );
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
          const barsPresentAfterDroppedBar = subcol.bars
            .filter((bar) => bar.left_position > droppedBar.left_position)
            .sort((a, b) => a.left_position - b.left_position);

          const barsPresentBeforeDroppedBar = subcol.bars.filter(
            (bar) => bar.left_position < droppedBar.left_position
          );

          if (!barsPresentAfterDroppedBar) return;

          const singleTickPxValue = mediaContainerWidth / totalDuration;
          const pxPerSecond = singleTickPxValue / markerInterval;

          for (let i = 0; i < barsPresentAfterDroppedBar.length; i++) {
            const curr = barsPresentAfterDroppedBar[i];
            const minLeft =
              i === 0
                ? droppedBar.left_position + droppedBar.width
                : barsPresentAfterDroppedBar[i - 1].left_position +
                  barsPresentAfterDroppedBar[i - 1].width;

            if (curr.left_position < minLeft) {
              curr.left_position = minLeft; // shift to right of previous bar
              curr.ruler_start_time = minLeft;

              const pxToTime = minLeft / pxPerSecond;
              curr.ruler_start_time_in_sec = pxToTime;
            }
          }

          const updatedBars = [
            ...barsPresentBeforeDroppedBar.map((bar) => ({ ...bar })),
            { ...droppedBar },
            ...barsPresentAfterDroppedBar.map((bar) => ({ ...bar })),
          ];

          const updatedData = await axios.patch(
            // sub-columns/:id - patch in backend
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/updateBar/${hoveredRowId}`,
            {
              addBarData: { ...updatedBars },
            }
          );
          console.log("updated data.data", updatedData.data);
          const getUpdatedData = updatedData.data;
          setBarsDataChangeAfterZoom(getUpdatedData);
          setBarsData(getUpdatedData);
          setBarAfterShift(true);
        })
      );
    } catch (error) {
      console.error("Error in shiftBarsAfterDrop:", error);
    }
  };

  const shiftGapsAfterDrop = async (data: BarsProp) => {
    try {
      const allUpdatedGaps = [];

      for (const subcol of data.sub_columns || []) {
        const droppedBar = subcol.bars?.find((b) => b.id === delBarFromRow?.id);
        if (!droppedBar) continue;

        const bars = subcol.bars
          .filter((bar) => bar.left_position > droppedBar.left_position)
          .sort((a, b) => a.left_position - b.left_position);

        const barIds = bars.map((bar) => bar.id);
        const relatedGaps = subcol.gaps.filter((gap) =>
          barIds.includes(gap.barId)
        );

        for (const gap of relatedGaps) {
          const bar = bars.find((b) => b.id === gap.barId);
          if (!bar) continue;

          const prevBar = subcol.bars
            .filter((b) => b.left_position < bar.left_position)
            .sort((a, b) => b.left_position - a.left_position)[0];

          const start_gap = prevBar ? prevBar.left_position + prevBar.width : 0;
          const end_gap = bar.left_position;
          const width = end_gap - start_gap;

          allUpdatedGaps.push({
            ...gap,
            start_gap,
            end_gap,
            width,
          });
        }
      }
      if (allUpdatedGaps.length > 0) {
        const updatedGap = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/g/update/batchUpdate/${data.project_id}`,
          { updatedGaps: allUpdatedGaps }
        );
        console.log("updated gap checkoo", updatedGap.data);
        setBarsData(updatedGap.data);
        setBarsDataChangeAfterZoom(updatedGap.data);
      }
    } catch (error) {
      console.error("Error in shiftGapsAfterDrop:", error);
    }
  };

  const updateGapRow = async (rowId: number, updatedGapRes: any) => {
    try {
      const afterAddingGap = await axios.patch(
        // sub-columns/gap/:id - patch in backend
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/gap/update/${rowId}`,
        {
          addGapData: { ...updatedGapRes }, // add gap to dropped subcol
        }
      );
      console.log("after adding gap", afterAddingGap.data);
      delCmGapId(delGapFromRow?.sub_col_id, delGapFromRow?.id); // delete gap from dragged bar row
    } catch (error) {
      console.error("Error in updateGapRow:", error);
    }
  };

  const updateGapLPAfterDrop = async (
    barId: number,
    newLeftPosition: number,
    NumHovRowId: number
  ) => {
    barsDataChangeAfterZoom?.sub_columns?.forEach(async (subcol) => {
      const targetGap = subcol.gaps?.find((g) => g.barId === barId);

      const bars = barsDataChangeAfterZoom?.sub_columns?.flatMap(
        (subcol) => subcol.bars || []
      );
      const filteredBars = bars?.filter(
        (bar) => bar.sub_col_id === NumHovRowId
      );

      const prevBar = filteredBars
        .filter((bar) => bar.left_position < newLeftPosition)
        .sort((a, b) => b.left_position - a.left_position)[0];

      const startGap = prevBar ? prevBar.left_position + prevBar.width : 0; // 0 for first gap
      const endGap = newLeftPosition;

      if (!targetGap) return;
      const updateGap = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/gaps/update/${prjId}/${targetGap.id}`,
        {
          ...targetGap,
          start_gap: startGap,
          end_gap: endGap,
          width: endGap - startGap,
          sub_col_id: NumHovRowId,
        }
      );
      const filteredData = updateGap.data.sub_columns.filter(
        (subcol: sub_column) => subcol.project_id === Number(prjId)
      );
      const updatedGapRes = filteredData
        .flatMap((subcol: any) => subcol.gaps || [])
        .find((gap: gap) => gap.id === targetGap.id);
      console.log("update gaps res checko", updatedGapRes);
      updateGapRow(NumHovRowId, updatedGapRes);
    });
  };

  // it adds dragged bar to the row where it has been dropped
  const updateBarRow = async (rowId: number, updatedBarRes: bar) => {
    try {
      const afterAddingBar = await axios.patch(
        // sub-columns/:id - patch in backend
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${rowId}`,
        {
          addBarData: { ...updatedBarRes }, // add bar to dropped subcol
        }
      );
      console.log("after adding bar", afterAddingBar.data);
      await delCmBarId(delBarFromRow?.sub_col_id, delBarFromRow?.id, rowId); // delete dragged bar from its row
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
        await updateBarRow(NumHovRowId, updatedBarRes);
        updateGapLPAfterDrop(barId, newLeftPosition, NumHovRowId);
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

    const mediaType = clipsInRow?.[0]?.media_type;

    return { clipsInRow, mediaType };
  };

  // use gesture and spring
  const bindDrag = useDrag(
    ({
      movement: [dx, dy],
      args: [barId, subColId, barType],
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
      barsDataChangeAfterZoom?.sub_columns?.forEach((subColumn) => {
        subColumn?.bars?.forEach((bar, barIndex) => {
          if (bar.id !== barId) return {};
          // for clip movement within the subcol(row)
          const minX = 0;
          const maxX = mediaContainerWidth - bar.width; // prevent going beyond right edge

          const prevBar = subColumn.bars[barIndex - 1];
          const nextBar = subColumn.bars[barIndex + 1];

          const prevX = prevBar ? prevBar.left_position + prevBar.width : 0;
          const nextX = nextBar ? nextBar.left_position : mediaContainerWidth;

          // for clip movement between the subcol(row)
          const verticalThreshold = 25;
          const threshold_condition = Math.abs(dy) > verticalThreshold;
          let newY: number;

          if (threshold_condition) {
            newY = last ? 0 : dy;
          }

          let newX;

          if (Math.abs(dy) < verticalThreshold) {
            // clamp newX to avoid overlap
            // console.log("dx checko", dx);
            // console.log("prev x", prevX);
            // console.log("next x", nextX);
            newX = Math.max(
              prevX,
              Math.min(bar.left_position + dx, nextX - bar.width)
            );
          } else {
            // here newX for dragging bw subcols
            // console.log("dx in else ", dx);
            newX = Math.max(minX, Math.min(bar.left_position + dx, maxX));
          }

          const hoveredRowId = getRowUnderCursor(event as PointerEvent);

          const rulerStartTimePxVal = newX;

          const singleTickPxValue = mediaContainerWidth / totalDuration;
          const pxPerSecond = singleTickPxValue / markerInterval;
          const pxToTime = rulerStartTimePxVal / pxPerSecond;

          setDelBarFromRow(bar);

          const delGap = subColumn?.gaps?.find((gap) => gap.barId === barId);
          setDelGapFromRow(delGap);

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
              const { clipsInRow, mediaType } = fetchClipsOnHover(hoveredRowId);
              const rowTypeEquals = mediaType === barType;
              console.log("clips in row ", clipsInRow);

              if (hoveredRowId && rowTypeEquals) {
                clipsInRow?.map((clips) => {
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
                        console.log(
                          "hover row id in lp after drop",
                          hoveredRowId
                        );
                        break;
                      }
                    }

                    if (newX >= start && newX <= end) {
                      // this condition is when dragged bar is above the bar present in the hovered subcol
                      resolvedX = bar.left_position + bar.width;

                      const rulerStartTimePxVal = resolvedX;
                      const pxPerSecond = singleTickPxValue / markerInterval;
                      const pxToTime = rulerStartTimePxVal / pxPerSecond;

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
                  updateBarLPAfterDrop(
                    barId,
                    resolvedX,
                    hoveredRowId,
                    rulerStartTimePxVal,
                    pxToTime
                  );
                });
              }
            }

            zoomApi.start((i) => {
              if (i !== getBarIndex) return {};
              return {
                clipLP: threshold_condition
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
          const trimmedSeconds =
            (trimmedPixels / singleTickPxValue) * markerInterval;
          const predictedStartTime = bar.start_time + trimmedSeconds;

          const minWidth = width * 0.1;
          let newWidth = Math.max(minWidth, Math.min(bar.width - dx, width));

          if (subColId === bar.sub_col_id) {
            if (bar.order === 0 && barIndex === 0) {
              if (predictedStartTime >= 0) {
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
              } else if (predictedStartTime <= -1) {
                // newWidth = Math.max(
                //   minWidth,
                //   Math.min(newWidth - dx, bar.width) // bar.width will be min in here
                // );

                newWidth = lastNewWidthLeftRef.current ?? newWidth;
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
              const minPosition = prevBar?.left_position + prevBar?.width;

              if (predictedStartTime >= 0) {
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
                lastNewWidthLeftRef.current = newWidth;
              } else if (predictedStartTime <= -1) {
                newWidth = lastNewWidthLeftRef.current ?? newWidth;
                newX = Math.max(
                  bar.left_position + dx,
                  bar.left_position + bar.width - newWidth // this will be max in here
                );
              }
            }
          }

          const rulerStartTimePxVal = Math.max(0, newX);
          const pxPerSecond = singleTickPxValue / markerInterval;
          const pxToTime = rulerStartTimePxVal / pxPerSecond;

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

          const rulerStartTimePxVal = bar.ruler_start_time;
          const pxToTime = bar.ruler_start_time_in_sec;

          const minWidth = width * 0.1;
          if (subColId === bar.sub_col_id) {
            const rowBars = subColumn.bars;

            if (predictedEndTime <= bar.duration) {
              const index = rowBars.findIndex((b) => b.id === bar.id);
              if (index !== -1) {
                const currentBar = rowBars[index];
                newWidth = Math.max(
                  minWidth,
                  Math.min(currentBar.width + dx, width)
                );

                const nextBar = rowBars[index + 1];
                if (nextBar) {
                  const maxRight = nextBar.left_position;
                  if (newWidth + currentBar.left_position > maxRight) {
                    newWidth = maxRight - currentBar.left_position;
                  }
                }

                lastNewWidthRightRef.current = newWidth;
              }
            } else if (predictedEndTime > bar.duration) {
              newWidth = lastNewWidthRightRef.current ?? bar.width; // bar.width in case newWidth is undefined
            }
          }

          zoomApi.start((i) => {
            if (allBars[i].id !== barId) return {};
            return { clipWidth: newWidth, immediate: true };
          });
          if (last) {
            updateBarAfterResize(
              bar,
              subColumn.bars,
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
  const deleteEmptyRow = async () => {
    try {
      const delSubCol = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/delSubCol/${prjId}`
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
    try {
      const delBar = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${cmSubColId}/bars/${cmBarId}`
      );

      const filteredData = delBar.data.filter(
        (bar: BarsProp) => bar.project_id === Number(prjId)
      );
      const updatedRow = filteredData[0];
      console.log("updated row bro after delcmbarid", updatedRow);
      await shiftBarsAfterDrop(updatedRow, cmBarId, hoveredRowId);
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  const delCmGapId = async (
    cmSubColId: number | undefined,
    cmGapId: number | undefined
  ) => {
    try {
      const delGap = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/gaps/${cmSubColId}/${cmGapId}`
      );
      const filteredData = delGap.data.filter(
        (gap: BarsProp) => gap.project_id === Number(prjId)
      );
      console.log("filtered data gap checko", filteredData);
      const updatedData = filteredData[0];
      await shiftGapsAfterDrop(updatedData);
      deleteEmptyRow();
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  // ********** context menu functions ************

  const handleDeleteBarAndGap = async (
    subColId: number,
    barId: number,
    subCol: sub_column
  ) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${subColId}/bars/${barId}`
      );

      const deleteBarGap = subCol.gaps.find((gap) => gap.barId === barId);
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/gaps/${deleteBarGap?.sub_col_id}/${deleteBarGap?.id}`
      );
      setFetchBars(true);
      deleteEmptyRow();
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  const handleRightClickBar = (
    e: React.MouseEvent<HTMLDivElement>,
    bar: bar,
    id: number,
    subColId: number,
    item: sub_column
  ) => {
    e.preventDefault();
    setOptions([
      { label: "edit", action: () => console.log(`Edit ${bar.id}`) },
      {
        label: "delete",
        action: () => handleDeleteBarAndGap(subColId, bar.id, item),
      },
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
      {item.bars.map((bar: bar) => {
        const barIndex = barIdsRef.current.findIndex(
          (id: any) => id === bar.id
        );
        const zoomSpring = zoomSprings[barIndex];

        return (
          <animated.div
            key={bar.id}
            {...bindDrag(bar.id, bar.sub_col_id, bar.type)}
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
              handleRightClickBar(e, bar, bar?.id, item?.sub_col_id, item)
            } // here we are passing bar info
          >
            <div
              className={`${
                item.media_type === "audio"
                  ? styles.audio_clip_box
                  : styles.m_item_box_drop
              } group`}
              style={{
                cursor: "grab",
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
                        backgroundImage: `url(${
                          bar?.thumbnail_url ? bar.thumbnail_url : ""
                        })`,
                        backgroundRepeat: "repeat-x",
                        backgroundSize: "auto 100%",
                      }}
                    ></div>
                  </div>
                )}
              </div>

              <div className={styles.bar_content}>
                {barsData?.sub_columns?.length ? (
                  <div
                    {...bindLeftResize(bar.id, bar.sub_col_id)}
                    className={`${
                      bar.type === "audio"
                        ? bar.width <= 125
                          ? styles.sm_audio_bar_arrow_div
                          : styles.audio_bar_arrow_div
                        : bar.width <= 125
                        ? styles.sm_bar_arrow_div
                        : styles.bar_arrow_div
                    } flex ${
                      bar.type === "video"
                        ? "group-hover:w-[3.5rem]"
                        : "group-hover:w-[3.5rem]"
                    } handle`}
                    style={{
                      touchAction: "none",
                    }}
                  >
                    {/* only show barcontent (bar arrow and label) when width of bar is above 125 */}
                    {bar.width >= 125 && (
                      <div
                        className={`${
                          bar.type === "audio"
                            ? bar.width <= 125
                              ? styles.sm_audio_bar_arrow_left
                              : styles.audio_bar_arrow_left
                            : bar.width <= 125
                            ? styles.sm_bar_arrow_left
                            : styles.bar_arrow_left
                        } flex ${
                          bar.type === "video"
                            ? "group-hover:hidden"
                            : "group-hover:hidden"
                        }`}
                      >
                        <div
                          className={`${
                            bar.type === "audio"
                              ? styles.audio_arrow_pad
                              : styles.arrow_pad
                          }`}
                        >
                          <div
                            className={`${
                              bar.type === "audio"
                                ? styles.audio_arrow_div
                                : styles.arrow_div
                            }`}
                          >
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
                      className={`${
                        bar.type === "video"
                          ? "group-hover:hidden"
                          : "group-hover:hidden"
                      } ${styles.m_type_label} flex`}
                    >
                      <div
                        className={`${
                          bar.type === "video"
                            ? styles.type_label_content
                            : styles.audio_type_label_content
                        }`}
                      >
                        <div
                          className={`${
                            bar.type === "audio"
                              ? styles.audio_type_icon
                              : styles.type_icon
                          } `}
                        >
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
                      {bar.type === "audio" && (
                        <div
                          className={styles.audio_bg_url}
                          style={{
                            backgroundImage: 'url("/wave.png")',
                            backgroundRepeat: "repeat-x",
                            backgroundSize: "auto 100%",
                          }}
                        ></div>
                      )}
                    </div>
                  </div>
                )}

                {barsData?.sub_columns?.length ? ( // length check if there are bars in sub_columns
                  <div
                    {...bindRightResize(bar.id, bar.sub_col_id)}
                    className={`${
                      bar.type === "audio"
                        ? bar.width <= 125
                          ? styles.sm_audio_bar_arrow_div
                          : styles.audio_bar_arrow_div
                        : bar.width <= 125
                        ? styles.sm_bar_arrow_div
                        : styles.bar_arrow_div
                    } flex ${
                      bar.type === "video"
                        ? "group-hover:w-[3.5rem]"
                        : "group-hover:w-[3.5rem]"
                    } handle`}
                    style={{
                      touchAction: "none",
                    }}
                  >
                    {/* only show barcontent (bar arrow and label) when width of bar is above 125 */}
                    {bar.width >= 125 && (
                      <div
                        className={`${
                          bar.type === "audio"
                            ? bar.width <= 125
                              ? styles.sm_audio_bar_arrow_left
                              : styles.audio_bar_arrow_right
                            : bar.width <= 125
                            ? styles.sm_bar_arrow_left
                            : styles.bar_arrow_right
                        } flex ${
                          bar.type === "video"
                            ? "group-hover:hidden"
                            : "group-hover:hidden"
                        }`}
                      >
                        <div
                          className={`${
                            bar.type === "audio"
                              ? styles.audio_arrow_pad
                              : styles.arrow_pad
                          }`}
                        >
                          <div
                            className={`${
                              bar.type === "audio"
                                ? styles.audio_arrow_div
                                : styles.arrow_div
                            }`}
                          >
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
