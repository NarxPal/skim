import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/timeline.module.css";
import { useDispatch } from "react-redux";
import { setPhPosition } from "@/redux/phPosition";
import { setPhPreview } from "@/redux/phPreview";

interface TimelineRulerProps {
  totalDuration?: number;
  zoomLevel: number;
  containerWidth?: number;
  scrollPosition: number;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalDuration,
  zoomLevel,
  containerWidth,
  scrollPosition,
}) => {
  const [tickPos, setTickPos] = useState<number[]>(); // having array since we are mapping tickpos in dom
  // const [tickGap, setTickGap] = useState<number>();

  const rulerRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (rulerRef.current) {
      rulerRef.current.scrollLeft = scrollPosition; // Sync scroll position
    }
  }, [scrollPosition]);

  useEffect(() => {
    const calcTicks = async () => {
      // timestep tell after how many seconds u want a tick
      let timeStep = 1; // for zoom level 10, a tick for every second
      console.log("zl level bro", zoomLevel);
      if (zoomLevel < 10) {
        timeStep = 5; // Change based on zoom level (e.g., 5 seconds for higher zoom), tick after every 5s, timestep should be dynamically based upon zoom level and media duration, currently having it 5
      }
      const positions: number[] = [];
      const numTicks = Math.ceil((totalDuration || 0) / timeStep);
      // numTicks tell how many total ticks will be present

      console.log("containerWidth:", containerWidth); // Log the containerWidth
      console.log("totalDuration:", totalDuration);
      // totalduration contains sum of all media clips
      for (let i = 0; i <= numTicks; i++) {
        const tickPosition = (i * (containerWidth || 0)) / (totalDuration || 0); //value for left position of each individual tick
        if (zoomLevel === 10) {
          positions.push(tickPosition); // tick for every sec * 10 px since cotnainer width is totalduration * zoom level
        }
        // console.log("tick position bro", tickPosition);
      }
      setTickPos(positions);
      console.log(positions);
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
          <div className={styles.time_div}></div>
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
