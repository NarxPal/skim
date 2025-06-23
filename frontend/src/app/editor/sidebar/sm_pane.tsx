import React from "react";
import styles from "@/styles/sidebar.module.css";
import Image from "next/image";

const Sm_pane = ({
  onCategorySelect,
}: {
  onCategorySelect: (category: string) => void;
}) => {
  const handleTabClick = (tab: string) => {
    onCategorySelect(tab);
  };

  return (
    <div className={styles.sm_pane}>
      <div className={styles.sm_inner}>
        <div className={styles.ul_items}>
          <div className={styles.all_icons}>
            <div className={styles.li} onClick={() => handleTabClick("upload")}>
              <Image
                src="/upload.png"
                alt="upload"
                height={20}
                width={20}
                priority={true}
              />

              <span className={styles.li_text}>upload</span>
            </div>

            <div className={styles.li} onClick={() => handleTabClick("video")}>
              <Image
                src="/video.png"
                alt="video"
                height={20}
                width={20}
                priority={true}
              />

              <span className={styles.li_text}>video</span>
            </div>

            <div className={styles.li} onClick={() => handleTabClick("audio")}>
              <Image
                src="/audio.png"
                alt="audio"
                height={20}
                width={20}
                priority={true}
              />

              <span className={styles.li_text}>audio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sm_pane;
