import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/timeline.module.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setPhPosition } from "@/redux/phPosition";
import { setPhPreview } from "@/redux/phPreview";
import { setMarkerInterval } from "@/redux/markerInterval";
import { throttle } from "lodash";
// types / interfaces import
import { BarsProp, bar } from "@/interfaces/barsProp";
import { SpringRef } from "@react-spring/web";
import axios from "axios";

interface TimelineRulerProps {
  totalDuration: number;
  zoomLevel: number;
  containerWidth: number;
  scrollPosition: number;
  setBarsDataChangeAfterZoom: React.Dispatch<
    React.SetStateAction<BarsProp | null>
  >;
  barsData: BarsProp | null;
  setBarsData: React.Dispatch<React.SetStateAction<BarsProp | null>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
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
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalDuration,
  zoomLevel,
  containerWidth,
  scrollPosition,
  setBarsDataChangeAfterZoom,
  barsData,
  setBarsData,
  videoRef,
  setShowPhTime,
  api,
  setFetchBars,
  prjId,
  allBars,
}) => {
  // usestate hooks
  const [tickPos, setTickPos] = useState<number[]>(); // having array since we are mapping tickpos in dom
  const [formattedMarkers, setFormattedMarkers] = useState<string[]>([]);

  const rulerRef = useRef<HTMLDivElement | null>(null);

  // redux state hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (rulerRef.current) {
      rulerRef.current.scrollLeft = scrollPosition; // Sync scroll position
    }
  }, [scrollPosition]);

  const updateBarAZ = async (barsDurations: BarsProp, interval: number) => {
    const singleTickPxValue = containerWidth / totalDuration; // equal px value for each marker
    const updateData = barsDurations.sub_columns.map((subCol) => ({
      ...subCol,
      bars: subCol?.bars?.map((bar) => {
        const duration = bar.clip_duration || 0; // zero probly for img
        console.log("clip duration in updatbaraz", duration);
        const width = Math.round((duration / interval) * singleTickPxValue);
        return { ...bar, width };
      }),
    }));
    if (updateData && updateData.length > 0) {
      const updatebar = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/subCol/${prjId}`,
        updateData
      );
      // console.log("updatebar CHECK CHECK", updatebar.config.data);
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

      // let basePxPerSec: number = 10;
      // let pixelsPerSecond: number = zoomLevel * basePxPerSec; // Pixels per second based on zoom level

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

      // Loop through barsData to calculate each bar's duration and width
      const barsDurations: BarsProp = {
        ...barsData,
        id: barsData?.id ?? 0, // for handling undefined
        parent_id: barsData?.parent_id ?? 0,
        project_id: barsData?.project_id ?? 0,
        user_id: barsData?.user_id ?? "",
        sub_columns:
          barsData?.sub_columns?.map((subCol) => {
            return {
              ...subCol, // Retain the original `subCol` structure
              bars: subCol?.bars?.map((bar) => {
                const duration = bar.clip_duration || 0; // zero probly for img
                console.log("bar.clipduration 1", duration);
                const width = Math.round(
                  (duration / interval) * singleTickPxValue //width not useful when resized and zoom level is changed
                ); // width being calculated here on the fly though we are saving in db through barsData hook

                // const left_position =
                //   bar.left_position !== 0
                //     ? bar.left_position - singleTickPxValue
                //     : bar.left_position;

                // rather than working on lp here i should create gap adjust that which will effect the lp of bars located around gaps
                api.start((i) => {
                  if (allBars[i].id !== bar.id) return {};
                  return {
                    clipWidth: width,
                  };
                });
                return { ...bar, width };
              }),
              gaps:
                subCol?.gaps?.map((gap) => {
                  const start_gap = gap.start_gap || 0;
                  const end_gap = gap.end_gap || 0;
                  const width = end_gap - start_gap;

                  return {
                    ...gap,
                    width,
                    start_gap,
                    end_gap,
                  };
                }) || [], // fallback for undefined gaps
            };
          }) || [],
      };
      console.log("bro barsdurations, SETBARSDATA RAN BRO", barsDurations);
      setBarsDataChangeAfterZoom(barsDurations);
      updateBarAZ(barsDurations, interval);
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
    const pixelValuePerStep = pxValueDiffPerMarker / markerInterval; // markerinterval is basically gap bw markers in sec
    return pos / pixelValuePerStep;
  };

  const throttledShowPhTimeUpdate = useRef(
    throttle(async (currentTime) => {
      const formattedTime = formatTime(currentTime);
      setShowPhTime(formattedTime);
    }, 500) // Throttle updates every 500ms
  ).current;

  const handleMousePos = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const hoverPosition = getHoverPosition(event);
    console.log("hp", hoverPosition);
    dispatch(setPhPosition(hoverPosition));
    if (videoRef.current && hoverPosition) {
      const time = positionToTime(hoverPosition);
      console.log("time bro", time);
      videoRef.current.currentTime = time || 0; // in case there is no clip the time would return nothing so fall to 0
      throttledShowPhTimeUpdate(time);
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
