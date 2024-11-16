import React, { useState, useRef } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";

const Timeline = () => {
  const [currentTime, setCurrentTime] = useState(0); // Current time in seconds
  const [duration, setDuration] = useState(60); // Total duration in seconds
  const timelineRef = useRef<HTMLDivElement>(null);

  const playheadPosition =
    timelineRef.current && duration > 0
      ? (currentTime / duration) * timelineRef.current.offsetWidth
      : 0;

  return (
    <div className={styles.timeline}>
      <div className={styles.tm_top}>
        <div className={styles.top_icons}>
          <div className={styles.tm_icon}>
            <Image
              src="/delete.png"
              width={15}
              height={15}
              alt="delete"
              priority={true}
            />
          </div>

          <div className={styles.tm_icon}>
            <Image
              src="/duplicate.png"
              width={15}
              height={15}
              alt="duplicate"
              priority={true}
            />
          </div>

          <div className={styles.tm_icon}>
            <Image
              src="/split.png"
              width={15}
              height={15}
              alt="split"
              priority={true}
            />
          </div>
        </div>
      </div>

      <div className={styles.tm_media_container}>
        <div
          className={styles.playhead}
          style={{ left: `${playheadPosition}px` }}
        ></div>
        {/* this is for vertical line */}
        <div className={styles.media_timeline}></div>{" "}
        {/* to show horizontal time series */}
        <div className={styles.item_box_div}>
          <div className={styles.m_item_box}></div>
          <div className={styles.m_item_box}></div>
          <div className={styles.m_item_box}></div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
