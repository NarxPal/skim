import React, { useEffect, useState } from "react";
import styles from "@/styles/timeline.module.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setPhPosition } from "@/redux/phPosition";
import { setPhPreview } from "@/redux/phPreview";
import { setMarkerInterval } from "@/redux/markerInterval";
// types / interfaces import
import { BarsProp, bar, sub_column } from "@/interfaces/barsProp";
import { SpringRef } from "@react-spring/web";
import axios from "axios";

interface TimelineRulerProps {
  totalDuration: number;
  zoomLevel: number;
  containerWidth: number;
  barsData: BarsProp | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  api: SpringRef<{
    // barID: number;
    subColId: number;
    clipTop: number;
    clipLP: number;
    clipWidth: number;
    zIndex: number;
  }>;
  setFetchBars: React.Dispatch<React.SetStateAction<boolean>>;
  prjId: string;
  allBars: bar[];
  phLeftRef: React.RefObject<HTMLDivElement>;
  manualPhLeftRef: React.MutableRefObject<number | null>;
  phLeftRefAfterMediaStop: React.MutableRefObject<number | null>;
  lastClipId: React.MutableRefObject<number | null>;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  rulerRef: React.MutableRefObject<HTMLDivElement | null>;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalDuration,
  zoomLevel,
  containerWidth,
  barsData,
  videoRef,
  api,
  setFetchBars,
  prjId,
  allBars,
  phLeftRef,
  manualPhLeftRef,
  phLeftRefAfterMediaStop,
  lastClipId,
  setShowPhTime,
  rulerRef,
}) => {
  // usestate hooks
  const [tickPos, setTickPos] = useState<number[]>(); // having array since we are mapping tickpos in dom
  const [formattedMarkers, setFormattedMarkers] = useState<string[]>([]);

  // redux state hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  const dispatch = useDispatch();

  const updateBarAZ = async (barsDurations: sub_column[]) => {
    const updateData = barsDurations;
    if (updateData && updateData.length > 0) {
      const updatebar = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/subCol/${prjId}`,
        updateData
      );
      console.log("updatebaraz checko", updatebar.data);
    }
    setFetchBars(true);
  };

  // todo: throttledShowPhTimeUpdate formatTime are used in playhead, phanimation and timelineRuler file so optimize it
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(2); // sec with upto two decimal places

    const paddedHrs = hrs < 10 ? `0${hrs}` : hrs;
    const paddedMins = mins < 10 ? `0${mins}` : mins;
    const formattedTime = `${paddedHrs}::${paddedMins}::${secs}`;

    return formattedTime;
  };

  function calculateInterval(totalDuration: number, zoomLevel: number): number {
    console.log("zl lolo", zoomLevel);
    const baseInterval = Math.max(
      30,
      Math.pow(2, Math.ceil(Math.log2(totalDuration / 300))) * 30
    );
    const zoomFactor = Math.pow(2, (10 - zoomLevel) / 2);
    return Math.round(baseInterval / zoomFactor);
  }

  useEffect(() => {
    const calcTicks = async () => {
      const positions: number[] = [];
      const markers: number[] = [];
      const formattedMarkersArray: string[] = [];

      console.log("containerWidth:", containerWidth);
      console.log("totalDuration:", totalDuration);

      const interval = calculateInterval(totalDuration, zoomLevel);
      dispatch(setMarkerInterval(interval));
      console.log("interval", interval);

      // To add interval(in hh:mm:ss format), per marker accross container width
      for (let time = 0; time <= containerWidth; time += interval) {
        markers.push(time); // Add the current time to markers
        formattedMarkersArray.push(formatTime(time));
      }
      setFormattedMarkers(formattedMarkersArray);

      // totalduration contains sum of all media clips
      const singleTickPxValue = containerWidth / totalDuration; // equal px value for each marker

      for (let i = 0; i <= totalDuration; i++) {
        const tickPosition = i * singleTickPxValue; //value for left position of each individual tick
        positions.push(tickPosition);
      }
      setTickPos(positions);

      const barsDurations: sub_column[] =
        barsData?.sub_columns?.map((subCol) => {
          const updatedBars =
            subCol.bars?.map((bar) => {
              const duration = bar.clip_duration || 0;
              const width = Math.round(
                (duration / interval) * singleTickPxValue
              );
              const pxPerSecond = singleTickPxValue / interval;
              const timeToPx = bar.ruler_start_time_in_sec * pxPerSecond;
              const left_position =
                bar.left_position !== 0 ? timeToPx : bar.left_position;

              api.start((i) => {
                if (allBars[i].id !== bar.id) return {};
                return {
                  clipWidth: width,
                  clipLP: left_position,
                };
              });

              return {
                ...bar,
                width,
                left_position,
                ruler_start_time: left_position,
              };
            }) || [];

          const updatedGaps =
            subCol.gaps?.map((gap) => {
              const barOfGap = updatedBars.find((bar) => bar.id === gap.barId);
              const prevBar = updatedBars
                .filter(
                  (bar) => bar.left_position < (barOfGap?.left_position || 0)
                )
                .sort((a, b) => b.left_position - a.left_position)[0];

              const start_gap = prevBar
                ? prevBar.left_position + prevBar.width
                : 0;
              const end_gap = barOfGap ? barOfGap.left_position : 0;
              const width = end_gap - start_gap;

              return {
                ...gap,
                width,
                start_gap,
                end_gap,
              };
            }) || [];

          return {
            ...subCol,
            bars: updatedBars,
            gaps: updatedGaps,
          };
        }) || [];

      console.log("bro barsdurations", barsDurations);
      updateBarAZ(barsDurations);
    };
    calcTicks();
  }, [zoomLevel, containerWidth, totalDuration]); // adding delCmBarId to again map over the data since barsData will be changed

  // Change position of ph during onClick over timeline ruler
  const getHoverPosition = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (rulerRef.current) {
      const rulerBounds = rulerRef.current.getBoundingClientRect();
      const rulerStyle = getComputedStyle(rulerRef.current);
      const paddingLeft = parseInt(rulerStyle.paddingLeft, 10); // 10 ensure no. is int and not string

      const scrollOffset = rulerRef.current.scrollLeft;
      const clientX =
        event.clientX - rulerBounds.left + scrollOffset - paddingLeft;
      const hoverPosition = Math.max(0, Math.floor(clientX));

      return hoverPosition;
    }
  };
  const positionToTime = (pos: number) => {
    const pxValueDiffPerMarker = containerWidth / totalDuration; // calculating px value which position the marker
    const pxPerSecond = pxValueDiffPerMarker / markerInterval; // markerinterval is basically gap bw markers in sec
    return pos / pxPerSecond;
  };

  const handleMousePos = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const hoverPosition = getHoverPosition(event);
    console.log("hp", hoverPosition);
    dispatch(setPhPosition(hoverPosition));
    if (phLeftRef.current) {
      phLeftRef.current.style.transform = `translateX(${hoverPosition}px)`;
      manualPhLeftRef.current = hoverPosition ?? null;
      phLeftRefAfterMediaStop.current = hoverPosition ?? null;
    }

    lastClipId.current = null;
    console.log("null", lastClipId.current);
    if (videoRef.current && hoverPosition) {
      const time = positionToTime(hoverPosition);
      console.log("time bro", time);
      videoRef.current.currentTime = time || 0; // in case there is no clip the time would return nothing so fall to 0
      const formattedTime = formatTime(time);
      setShowPhTime(formattedTime);
    }
  };

  const handleMouseHover = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const hoverPosition = getHoverPosition(event);
    dispatch(setPhPreview(hoverPosition));
    // preview will not be showing while dragging due to ph_rel and onMouseLeave
  };

  return (
    <div
      className={styles.ruler_div}
      ref={rulerRef}
      onMouseMove={handleMouseHover}
      onClick={handleMousePos}
      onMouseLeave={() => dispatch(setPhPreview(null))}
    >
      <div className={styles.ruler_content}>
        <div className={styles.time_ticks}>
          <div className={styles.time_div}>
            {totalDuration !== 0
              ? tickPos &&
                tickPos.map((pos, index) => (
                  <div
                    key={index}
                    className={styles.time}
                    style={{ left: `${pos}px` }}
                  >
                    {formattedMarkers && formattedMarkers[index]}
                  </div>
                ))
              : null}
          </div>
          <div className={styles.ticks_div}>
            {totalDuration !== 0
              ? tickPos &&
                tickPos.map((pos, index) => (
                  <div
                    key={index}
                    className={styles.tick}
                    style={{ left: `${pos}px` }}
                  >
                    |
                  </div>
                ))
              : null}
            {/* later show the timelineruler for null as well */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineRuler;
