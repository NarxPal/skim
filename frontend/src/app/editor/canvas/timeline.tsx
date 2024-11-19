import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";

type MediaItem = {
  signedUrl: string | null;
  name: string;
  filepath: string;
  type: string;
  width: number;
  left: number;
  id: number;
};

const Timeline = () => {
  // const [currentTime, setCurrentTime] = useState(0); // Current time in seconds
  // const [duration, setDuration] = useState(60); // Total duration in seconds
  const [droppedItem, setDroppedItem] = useState<MediaItem[]>([]); // media items that will be dropped in timeline will be stored in this state variable

  const [handleRightItems, setHandleRightItems] = useState<MediaItem[]>([]);
  const [handleLeftItems, setHandleLeftItems] = useState<MediaItem[]>([]);

  // const [isResizing, setIsResizing] = useState<{
  //   id: number;
  //   handle: "left" | "right";
  // } | null>(null);

  const [barState, setBarState] = useState({ width: 200, left: 50 });

  const isResizing = useRef(false);
  const resizeDirection = useRef<"left" | "right" | null>(null);
  const startX = useRef(0);

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
    console.log("dropped item bro", dropped_Item);
    const parsedItem = JSON.parse(dropped_Item);

    setDroppedItem((prev) => {
      const updatedItems = [...prev, parsedItem];
      return updatedItems;
    });

    console.log("signed url bro", parsedItem.signedUrl);
  };

  const myfunction = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const parentElement = e.currentTarget; // This refers to the div that triggered the event
    const parentRect = parentElement.getBoundingClientRect();

    // Get mouse coordinates relative to the parent element
    const x = e.clientX - parentRect.left;
    const y = e.clientY - parentRect.top;

    // Log or use the coordinates
    const coor = `Coordinates: (${x}, ${y})`;
    // document.getElementById("demo")!.innerHTML = coor;
    // console.log("coordinates bro:", coor);
  };

  const clearMyFunction = () => {};

  const startResize = (e: React.MouseEvent, direction: "left" | "right") => {
    isResizing.current = true;
    resizeDirection.current = direction;
    startX.current = e.clientX;
    document.addEventListener("mousemove", resizeBar);
    document.addEventListener("mouseup", stopResize);
  };

  const resizeBar = (e: MouseEvent) => {
    if (!isResizing.current || !resizeDirection.current) return;

    const dx = e.clientX - startX.current;

    setBarState((prevState) => {
      const newWidth =
        resizeDirection.current === "left"
          ? prevState.width - dx
          : prevState.width + dx;
      const newLeft =
        resizeDirection.current === "left"
          ? prevState.left + dx
          : prevState.left;

      return {
        width: Math.max(newWidth, 50), // Ensure minimum width
        left: newLeft,
      };
    });

    startX.current = e.clientX;
  };

  const stopResize = () => {
    isResizing.current = false;
    resizeDirection.current = null;
    document.removeEventListener("mousemove", resizeBar);
    document.removeEventListener("mouseup", stopResize);
  };

  const SCALING_FACTOR = 0.1;

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
              draggable={false}
            />
          </div>

          <div className={styles.tm_icon}>
            <Image
              src="/duplicate.png"
              width={15}
              height={15}
              alt="duplicate"
              priority={true}
              draggable={false}
            />
          </div>

          <div className={styles.tm_icon}>
            <Image
              src="/split.png"
              width={15}
              height={15}
              alt="split"
              priority={true}
              draggable={false}
            />
          </div>
        </div>
      </div>
      <div
        className={styles.tm_m_container_div}
        onMouseMove={(e) => myfunction(e)}
        onMouseOut={clearMyFunction}
      >
        <div className={styles.tm_media_container}>
          <div
            className={styles.item_box_div}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e)}
            style={{
              width: `${barState.width}px`,
              left: `${barState.left}px`,
            }}
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
              >
                <div className={styles.bar_content}>
                  {droppedItem && droppedItem.length !== 0 ? (
                    // <div className={styles.bar_handle_left}>
                    <div
                      className={styles.bar_arrow}
                      onMouseDown={(e) => startResize(e, "left")}
                    >
                      <Image
                        src="/left_arrow.png"
                        alt="left_arrow"
                        width={10}
                        height={10}
                        priority={true}
                        draggable={false}
                      />
                    </div>
                  ) : // </div>
                  null}
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
                                draggable={false}
                              />
                            )}
                          </div>
                          <span className={styles.m_item_label}>
                            {item.name.length > 20
                              ? `${item.name.substring(0, 40)}...`
                              : item.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {droppedItem && droppedItem.length !== 0 ? (
                    // <div className={styles.bar_handle_right}>
                    <div
                      className={styles.bar_arrow}
                      // onMouseDown={(e) => handleMouseDownRight(index, e)}
                      onMouseDown={(e) => startResize(e, "right")}
                    >
                      <Image
                        src="/chevron_right.png"
                        alt="right_arrow"
                        width={10}
                        height={10}
                        priority={true}
                        draggable={false}
                      />
                    </div>
                  ) : // </div>
                  null}
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
