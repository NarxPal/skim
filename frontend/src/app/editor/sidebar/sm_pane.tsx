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
        <ul className={styles.ul_items}>
          <li className={styles.li} onClick={() => handleTabClick("upload")}>
            <Image
              src="/upload2.png"
              alt="upload"
              height={20}
              width={20}
              priority={true}
            />

            {/* <span className={styles.li_text}>upload</span> */}
          </li>

          <li className={styles.li} onClick={() => handleTabClick("text")}>
            <div className={styles.icon_div}>
              <Image
                src="/text2.png"
                alt="text"
                height={20}
                width={20}
                priority={true}
              />
            </div>
            {/* <span className={styles.li_text}>text</span> */}
          </li>

          <li className={styles.li} onClick={() => handleTabClick("video")}>
            <div className={styles.icon_div}>
              <Image
                src="/video.png"
                alt="video"
                height={20}
                width={20}
                priority={true}
              />
            </div>

            {/* <span className={styles.li_text}>video</span> */}
          </li>

          <li className={styles.li} onClick={() => handleTabClick("audio")}>
            <div className={styles.icon_div}>
              <Image
                src="/audio.png"
                alt="audio"
                height={20}
                width={20}
                priority={true}
              />
            </div>

            {/* <span className={styles.li_text}>audio</span> */}
          </li>

          <li className={styles.li} onClick={() => handleTabClick("image")}>
            <div className={styles.icon_div}>
              <Image
                src="/image.png"
                alt="image"
                height={20}
                width={20}
                priority={true}
              />
            </div>

            {/* <span className={styles.li_text}>image </span> */}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sm_pane;
