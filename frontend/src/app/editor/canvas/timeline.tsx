import React, { useState, useRef } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";

type MediaItem = {
  signedUrl: string | null;
  name: string;
  filepath: string;
  type: string;
  width: number | string;
};

const Timeline = () => {
  // const [currentTime, setCurrentTime] = useState(0); // Current time in seconds
  // const [duration, setDuration] = useState(60); // Total duration in seconds
  const [droppedItem, setDroppedItem] = useState<MediaItem[]>([]); // media items that will be dropped in timeline will be stored in this state variable

  // const timelineRef = useRef<HTMLDivElement>(null);

  const icons: { [key: string]: string } = {
    audio: "/audio.png",
    video: "/video.png",
    image: "/image.png",
    text: "/text.png",
  };

  // const playheadPosition =
  //   timelineRef.current && duration > 0
  //     ? (currentTime / duration) * timelineRef.current.offsetWidth
  //     : 0;

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Allow drop
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped_Item = event.dataTransfer.getData("text/plain");
    const parsedItem = JSON.parse(dropped_Item);
    setDroppedItem((prev) => [...prev, parsedItem]);
    console.log(`Dropped item bro: ${parsedItem}`);
    console.log("signed url bro", parsedItem.signedUrl);
  };

  /*   const handleMouseDown = (index, e) => {
    const startX = e.clientX;
    const startWidth = droppedItems[index].width;

    const handleMouseMove = (e) => {
      const newWidth = startWidth + (e.clientX - startX);
      setDroppedItem((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, width: Math.max(newWidth, 50) } : item
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  } */ return (
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
            // style={{ left: `${playheadPosition}px` }}
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
                style={{
                  width: item && item.width ? `${item.width}` : "100%", // the width is saved as percentage (default = 100%)
                }}
              >
                <div className={styles.bar_content}>
                  {droppedItem && droppedItem.length !== 0 ? (
                    <div className={styles.bar_arrow}>
                      <Image
                        src="/left_arrow.png"
                        alt="left_arrow"
                        width={10}
                        height={10}
                        priority={true}
                      />
                    </div>
                  ) : null}
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
                          <span className={styles.m_item_label}>
                            {item.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {droppedItem && droppedItem.length !== 0 ? (
                    <div className={styles.bar_arrow}>
                      <Image
                        src="/chevron_right.png"
                        alt="right_arrow"
                        width={10}
                        height={10}
                        priority={true}
                      />
                    </div>
                  ) : null}
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
