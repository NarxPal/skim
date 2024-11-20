import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";
import { supabase } from "../../../../supabaseClient";

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
  const [droppedItem, setDroppedItem] = useState<MediaItem[]>([]); // media items that will be dropped in timeline will be stored in this state variable

  const isResizing = useRef(false);
  const resizeDirection = useRef<"left" | "right" | null>(null);
  const startX = useRef(0);
  const activeBarId = useRef<number | null>(null);

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
    const dropped_Item = event.dataTransfer.getData("text/plain"); // the data here is passed from leftpane.tsx
    // console.log("dropped item bro", dropped_Item);
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
  };

  const clearMyFunction = () => {};

  const startResize = (
    e: React.MouseEvent,
    direction: "left" | "right",
    barId: number
  ) => {
    isResizing.current = true;
    resizeDirection.current = direction;
    startX.current = e.clientX;
    activeBarId.current = barId;

    document.addEventListener("mousemove", resizeBar);
    document.addEventListener("mouseup", stopResize);
  };

  const updateItemInDatabase = async (
    id: number,
    width: number,
    left: number
  ) => {
    // supabase.channel("media_file_channel").on(
    //   "postgres_changes",
    //   {
    //     schema: "public",
    //     event: "UPDATE",
    //     table: "media_files",
    //   },
    //   (payload) => {
    //     // console.log("payload bro", payload)
    //   }
    // );

    const { error } = await supabase
      .from("media_files")
      .update({ width, left })
      .eq("id", id);

    if (error) console.error("Error updating item:", error);
  };

  const resizeBar = (e: MouseEvent) => {
    if (!isResizing.current || !resizeDirection.current) return;

    const dx = e.clientX - startX.current; // the e.clientx is the current mouse position during the movement of the mouse and we are subtracting it with initial mouse (starting) position during mousedown

    // setBarState((prevState) => {
    //   let newWidth =
    //     resizeDirection.current === "left"
    //       ? prevState.left === 0
    //         ? prevState.width
    //         : prevState.width - dx
    //       : prevState.width + dx;

    //   let newLeft =
    //     resizeDirection.current === "left"
    //       ? Math.max(prevState.left + dx, 0)
    //       : prevState.left;

    //   return {
    //     width: Math.max(newWidth, 125),
    //     left: newLeft,
    //   };
    // });

    setDroppedItem((prevBars) => {
      return prevBars.map((bar) => {
        if (bar.id === activeBarId.current) {
          const newWidth =
            resizeDirection.current === "left"
              ? bar.left === 0
                ? bar.width
                : bar.width - dx
              : bar.width + dx;

          const newLeft =
            resizeDirection.current === "left"
              ? Math.max(bar.left + dx, 0)
              : bar.left;

          updateItemInDatabase(bar.id, newWidth, newLeft);

          return {
            ...bar,
            width: Math.max(newWidth, 125),
            left: newLeft,
          };
        }
        return bar;
      });
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

      <div className={styles.media_parent_div}>
        <div
          className={styles.tm_m_container_div}
          onMouseMove={(e) => myfunction(e)}
          onMouseOut={clearMyFunction}
        >
          <div className={styles.tm_media_container}>
            {(droppedItem.length === 0
              ? new Array(3).fill(null)
              : droppedItem
            ).map((item, index) => (
              <div
                className={styles.item_box_div}
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e)}
                key={item ? item.id : index}
                style={{
                  width: item && item.width ? `${item.width}px` : "200px",
                  left: item && item.left ? `${item.left}px` : "10px",
                }}
              >
                <div
                  // key={index}
                  className={
                    droppedItem.length !== 0
                      ? `${styles.m_item_box_drop}`
                      : `${styles.m_item_box}`
                  }
                >
                  <div className={styles.bar_content}>
                    {droppedItem && droppedItem.length !== 0 ? (
                      <div
                        className={styles.bar_arrow}
                        onMouseDown={(e) => startResize(e, "left", item.id)}
                      >
                        <div className={styles.arrow_div}>
                          <Image
                            src="/left_arrow.png"
                            alt="left_arrow"
                            width={10}
                            height={10}
                            priority={true}
                            draggable={false}
                          />
                        </div>
                      </div>
                    ) : null}
                    <div
                      className={
                        droppedItem.length !== 0
                          ? `${styles.item_content_drop}`
                          : ""
                      }
                    >
                      {item && (
                        <div className={styles.m_item_keys}>
                          <div
                            className={styles.m_item_thumb}
                            style={{
                              backgroundImage: item
                                ? `url(${item.signedUrl})`
                                : "none",

                              backgroundRepeat: "repeat-x",
                              backgroundSize: "auto 100%",
                            }}
                          ></div>

                          {item.width >= 300 && (
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
                                  ? `${item.name.substring(0, 25)}...`
                                  : item.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {droppedItem && droppedItem.length !== 0 ? (
                      <div
                        className={styles.bar_arrow}
                        onMouseDown={(e) => startResize(e, "right", item.id)}
                      >
                        <div className={styles.arrow_div}>
                          <Image
                            src="/chevron_right.png"
                            alt="right_arrow"
                            width={10}
                            height={10}
                            priority={true}
                            draggable={false}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
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
