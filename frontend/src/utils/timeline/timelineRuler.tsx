import React from "react";
import styles from "@/styles/timeline.module.css";

const TimelineRuler = () => {
  return (
    <div className={styles.ruler_div}>
      <div className={styles.ruler_content}>
        <div className={styles.time_ticks}>
          <div className={styles.time_div}></div>
          <div className={styles.ticks_div}></div>
        </div>
      </div>
    </div>
  );
};

export default TimelineRuler;
