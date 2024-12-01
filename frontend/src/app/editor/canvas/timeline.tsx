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
  column: number;
};

type BarsProp = {
  id: number;
  user_id: string;
  column_id: number;
  name: string;
  media_id: number;
  left_position: number;
  width: number;
  position: number;
  project_id: number;
};

const Timeline = () => {
  const [droppedItem, setDroppedItem] = useState<MediaItem[]>([]); // media items that will be dropped in timeline will be stored in this state variable
  const [barsData, setBarsData] = useState<BarsProp[]>([]);

  const [barDragging, setBarDragging] = useState<boolean>(false);

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
    event.preventDefault();
    // setBarDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log("handle drop u are inside ");
    const dropped_Item = event.dataTransfer.getData("text/plain"); // the data here is passed from leftpane.tsx
    const parsedItem = JSON.parse(dropped_Item);
    console.log("dropped parsed item bro", parsedItem);

    setDroppedItem((prev) => {
      const updatedItems = [...prev, parsedItem];
      return updatedItems;
    });

    // setBarDragging(false);
    // console.log("signed url bro", parsedItem.signedUrl);
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

    setDroppedItem((prevBars) => {
      // here instead of setDroppedItem we will use something for bars table so new state variable create here
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

  const updateBarCol = async (updatedBars: MediaItem) => {
    const { data, error } = await supabase
      .from("media_files")
      .update({ column: updatedBars.column })
      .eq("id", updatedBars.id);

    if (error) {
      console.error("Error updating item:", error);
    } else {
      console.log("Update successful:", data);
    }
  };

  const handleBarDragStart = (
    index: number,
    e: React.DragEvent<HTMLDivElement>
  ) => {
    setBarDragging(true);
    const draggedBarIndex = JSON.stringify(index);
    e.dataTransfer.setData("draggedIndex", draggedBarIndex); //here converting id(number) to string since setData require data in string
    console.log("bar drag started bro");
  };

  const handleBarDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow the element to be dropped by preventing the default behavior
    e.preventDefault();
  };

  const handleBarDrop = (
    e: React.DragEvent<HTMLDivElement>,
    Barindex: string
  ) => {
    const draggedIndex = e.dataTransfer.getData("draggedIndex"); // it is index value since we are passing index of the draggedbar in handleDragStart
    const targetColumnEle = e.target as HTMLElement;
    const targetColumnId = targetColumnEle.getAttribute("id"); // individual bars id

    // console.log(
    //   "draggedidnex bro, paramindex bro",
    //   draggedIndex,
    //   targetColumn.id,
    //   targetColumnEle
    // );

    const draggedIndexNum = Number(draggedIndex); // Convert index to a number
    // const draggedItem = droppedItem[draggedIndexNum];

    // converting draggedIndex to number from string
    // targetIndex contains the id(not index) of the targeted bar
    console.log("targetcolid above", Number(targetColumnId));
    console.log("dragidexNumber", draggedIndexNum);
    if (draggedIndexNum === (targetColumnId as number | null)) return; // Prevent reordering if same index

    // Reorder the bars by changing their position
    const updatedBars = [...droppedItem];

    console.log("updated bars after droppping: ", updatedBars);
    console.log("droppedItem", droppedItem);

    const draggedItem = updatedBars.splice(Number(draggedIndex), 1)[0];

    draggedItem.column = Number(targetColumnId);

    console.log("draggedItem.column", draggedItem.column);
    console.log("target col id", Number(targetColumnId));
    console.log("barindex bro", Barindex);

    console.log("draggedbar", draggedItem);

    // Remove the dragged item from its old position
    updatedBars.splice(Number(Barindex), 0, draggedItem); // it will reorder the array

    console.log("updatedBars splice:", updatedBars);

    updatedBars.forEach((bar) => {
      console.log("bar foreach", bar.column);
      console.log("bars bro", bar);
      updateBarCol(bar);
    });

    setDroppedItem(updatedBars); // Update state with the new order
    setBarDragging(false);
  };

  const handleBarDragEnd = () => {
    setBarDragging(false);
    // Optionally, you can reset or update styles here
  };

  // useEffect(() => {
  //   console.log("barDragging state", barDragging);
  // }, [barDragging]);

  const handleDynamicDrop = (
    e: React.DragEvent<HTMLDivElement>,
    index: string
  ) => {
    console.log("bardragging state:", barDragging);
    if (barDragging) {
      console.log("u are to run handleBar drop");
      handleBarDrop(e, index);
    } else {
      console.log("u are to run handleDrop");
      handleDrop(e);
    }
  };

  const handleDynamicDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (barDragging) {
      handleBarDragOver(e);
    } else {
      handleDragOver(e);
    }
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
          {/* // here we should map columns table rather than droppedItem */}
          <div className={styles.tm_media_container}>
            {(droppedItem.length === 0
              ? new Array(3).fill(null)
              : droppedItem
            ).map((item, index) => (
              <div
                // className={styles.item_box_div}
                key={index}
                id={index.toString()} // id will contain numeric value for each columns
                onDragOver={(e) => handleDynamicDragOver(e)}
                onDrop={(e) => handleDynamicDrop(e, index.toString())}
              >
                <div
                  className={styles.item_box_div}
                  style={{
                    width: item && item.width ? `${item.width}px` : "800px", // since we are not using width in mediaItem[]
                    left: item && item.left ? `${item.left}px` : "10px",
                  }}
                >
                  <div
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
                        draggable
                        onDragStart={(e) => handleBarDragStart(index, e)}
                        onDragEnd={(e) => handleBarDragEnd()}
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
                                      src={
                                        icons[item.type as keyof typeof icons]
                                      }
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
