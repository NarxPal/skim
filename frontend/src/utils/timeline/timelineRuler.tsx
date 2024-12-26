import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/timeline.module.css";

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
  const [tickPos, setTickPos] = useState<number[]>();
  const [tickGap, setTickGap] = useState<number>();

  const rulerRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className={styles.ruler_div} ref={rulerRef}>
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
