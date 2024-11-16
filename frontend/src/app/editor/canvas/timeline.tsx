import React, { useState, useRef } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";

type MediaItem = {
  signedUrl: string | null;
  name: string;
  filepath: string;
  type: string;
};

const Timeline = () => {
  const [currentTime, setCurrentTime] = useState(0); // Current time in seconds
  const [duration, setDuration] = useState(60); // Total duration in seconds
  const [droppedItem, setDroppedItem] = useState<MediaItem[]>([]); // media items that will be dropped in timeline will be stored in this state variable

  const timelineRef = useRef<HTMLDivElement>(null);

  const icons: { [key: string]: string } = {
    audio: "/audio.png",
    video: "/video.png",
    image: "/image.png",
    text: "/text.png",
  };

  const playheadPosition =
    timelineRef.current && duration > 0
      ? (currentTime / duration) * timelineRef.current.offsetWidth
      : 0;

  const handleDragOver = (event: any) => {
    event.preventDefault(); // Allow drop
  };

  const handleDrop = (event: any) => {
    event.preventDefault();
    const dropped_Item = event.dataTransfer.getData("text/plain");
    const parsedItem = JSON.parse(dropped_Item);
    setDroppedItem((prev) => [...prev, parsedItem]);
    console.log(`Dropped item bro: ${parsedItem}`);
    console.log("signed url bro", parsedItem.signedUrl);
  };

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
      <div className={styles.tm_m_container_div}>
        <div className={styles.tm_media_container}>
          <div
            className={styles.playhead}
            style={{ left: `${playheadPosition}px` }}
          ></div>
          {/* this is for vertical line */}
          <div className={styles.media_timeline}></div>{" "}
          {/* to show horizontal time series */}
          <div
            className={styles.item_box_div}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e)}
          >
            {(droppedItem.length === 0
              ? new Array(3).fill(null)
              : droppedItem
            ).map((item, index) => (
              <div
                key={index}
                className={
                  droppedItem.length !== 0
                    ? `${styles.m_item_box_drop}`
                    : `${styles.m_item_box}`
                }
                style={
                  {
                    // width: item`${item.duration * 11}px`, // Set a default width if no item
                  }
                }
              >
                <div
                  className={
                    droppedItem.length !== 0
                      ? `${styles.item_content_drop}`
                      : ""
                  }
                >
                  {/* Show a label only if there is a media item */}
                  {item && (
                    <div className={styles.m_item_keys}>
                      <div
                        className={styles.m_item_thumb}
                        style={{
                          backgroundImage: item
                            ? `url(${item.signedUrl})`
                            : "none",

                          backgroundRepeat: "repeat-x",
                          backgroundSize: "contain",
                        }}
                      ></div>
                      <div className={styles.m_type_label}>
                        <div className={styles.type_icon}>
                          {item.type in icons && (
                            <Image
                              src={icons[item.type as keyof typeof icons]}
                              alt={item.type}
                              width={10}
                              height={10}
                              priority={true}
                            />
                          )}
                          {/* <span className={styles.m_item_type}>
                            {item.type}
                          </span> */}
                        </div>
                        <span className={styles.m_item_label}>{item.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
