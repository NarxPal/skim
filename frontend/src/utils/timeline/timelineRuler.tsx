import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/timeline.module.css";
import { useDispatch } from "react-redux";
import { setPhPosition } from "@/redux/phPosition";
import { setPhPreview } from "@/redux/phPreview";

// types / interfaces import
import { BarsProp } from "@/interfaces/barsProp";
interface TimelineRulerProps {
  totalDuration: number;
  zoomLevel: number;
  containerWidth: number;
  scrollPosition: number;
  setBarsDataChangeAfterZoom: React.Dispatch<
    React.SetStateAction<BarsProp | null>
  >;
  barsData: BarsProp | null;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalDuration,
  zoomLevel,
  containerWidth,
  scrollPosition,
  setBarsDataChangeAfterZoom,
  barsData,
}) => {
  // usestate hooks
  const [tickPos, setTickPos] = useState<number[]>(); // having array since we are mapping tickpos in dom
  const [tickInterval, setTickInterval] = useState<number[]>();
  const [formattedMarkers, setFormattedMarkers] = useState<string[]>([]);

  const rulerRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (rulerRef.current) {
      rulerRef.current.scrollLeft = scrollPosition; // Sync scroll position
    }
  }, [scrollPosition]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  useEffect(() => {
    const calcTicks = async () => {
      // timestep tell after how many seconds u want a tick
      let timeStep = 1; // for zoom level 10, a tick for every second
      console.log("zl level bro", zoomLevel);

      // if (zoomLevel < 10) {
      //   timeStep = 5; // Change based on zoom level (e.g., 5 seconds for higher zoom), tick after every 5s, timestep should be dynamically based upon zoom level and media duration, currently having it 5
      // }
      const positions: number[] = [];
      const markers: number[] = [];
      const formattedMarkersArray: string[] = [];

      const numTicks = Math.ceil(totalDuration / timeStep);
      // numTicks tell how many total ticks will be present

      console.log("containerWidth:", containerWidth);
      console.log("totalDuration:", totalDuration);

      let interval: number;
      // let basePxPerSec: number = 10;
      // let pixelsPerSecond: number = zoomLevel * basePxPerSec; // Pixels per second based on zoom level

      if (totalDuration >= 3600) {
        interval = 1800; // 30-minute interval for videos >= 1 hour
      } else if (totalDuration >= 1800) {
        interval = 900; // 15-minute interval for 30 min to 1 hour
      } else if (totalDuration >= 900) {
        interval = 450; // 7.5-minute interval for 15 to 30 min
      } else if (totalDuration >= 300) {
        interval = 150; // 2.5-min interval for 5 to 15 min
      } else {
        interval = 30; // 30-second interval for videos < 5 min
      }

      // Adjust interval based on zoom level
      if (zoomLevel >= 8) {
        // For high zoom levels (8 or more), keep the interval relatively small
        if (interval === 30) {
          interval = 30; // Interval stays at 30 seconds for small videos
        } else if (interval === 150) {
          interval = 30; // 2.5 minutes adjusted to 30 seconds
        } else if (interval === 450) {
          interval = 60; // 7.5 minutes adjusted to 1 minute
        } else if (interval === 900) {
          interval = 120; // 15 minutes adjusted to 2 minutes
        } else if (interval === 1800) {
          interval = 300; // 30 minutes adjusted to 5 minutes
        }
      } else if (zoomLevel >= 5) {
        // For medium zoom levels (5-7), make the interval larger
        if (interval === 30) {
          interval = 60; // 30 seconds adjusted to 1 minute
        } else if (interval === 150) {
          interval = 300; // 2.5 minutes adjusted to 5 minutes
        } else if (interval === 450) {
          interval = 600; // 7.5 minutes adjusted to 10 minutes
        } else if (interval === 900) {
          interval = 1200; // 15 minutes adjusted to 20 minutes
        } else if (interval === 1800) {
          interval = 1800; // 30 minutes stays at 30 minutes
        }
      } else {
        // For low zoom levels (less than 5), make the interval even larger
        if (interval === 30) {
          interval = 120; // 30 seconds adjusted to 2 minutes
        } else if (interval === 150) {
          interval = 300; // 2.5 minutes adjusted to 5 minutes
        } else if (interval === 450) {
          interval = 600; // 7.5 minutes adjusted to 10 minutes
        } else if (interval === 900) {
          interval = 1200; // 15 minutes adjusted to 20 minutes
        } else if (interval === 1800) {
          interval = 2400; // 30 minutes adjusted to 40 minutes
        }
      }

      // To add interval(in hh:mm:ss format) per marker accross container width
      for (let time = 0; time <= containerWidth; time += interval) {
        markers.push(time); // Add the current time to markers
        formattedMarkersArray.push(formatTime(time));
      }
      setTickInterval(markers);
      setFormattedMarkers(formattedMarkersArray);

      // totalduration contains sum of all media clips
      // to add px value per marker
      const singleTickPxValue = containerWidth / totalDuration; // equal px value for each marker, it changes based upon zoom level

      for (let i = 0; i <= totalDuration; i++) {
        const tickPosition = i * singleTickPxValue; //value for left position of each individual tick
        positions.push(tickPosition);
      }
      setTickPos(positions);
      const newBarWidth = (175 / interval) * singleTickPxValue;
      // console.log("new bar width bro", newBarWidth);

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
                const duration = bar.duration || 0; // Calculate duration if missing
                const width = Math.round(
                  (duration / interval) * singleTickPxValue
                );
                return { ...bar, width };
              }),
            };
          }) || [],
      };
      console.log("bro barsdurations", barsDurations);
      setBarsDataChangeAfterZoom(barsDurations);
    };
    calcTicks();
  }, [zoomLevel, containerWidth, totalDuration]);

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

  const handleMousePos = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const hoverPosition = getHoverPosition(event);
    dispatch(setPhPosition(hoverPosition));
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
                    {zoomLevel === 10
                      ? `${index.toString()}s`
                      : `${formattedMarkers && formattedMarkers[index]}s`}
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
