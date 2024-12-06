import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";
import { supabase } from "../../../../supabaseClient";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

type MediaItem = {
  signedUrl: string | null;
  name: string;
  filepath: string;
  type: string;
  id: number;
  column: number;
  width: number;
  left_position: number;
  user_id: string;
  project_id: number;
};

type bar = {
  filepath: string;
  id: number;
  left_position: number;
  name: string;
  project_id: number;
  signedUrl: string;
  type: string;
  user_id: string;
  width: number;
};

type sub_column = {
  id: number;
  parent_id: number;
  project_id: number;
  user_id: string;
  bars: bar[];
};
type BarsProp = {
  id: number;
  parent_id: number;
  project_id: number;
  user_id: string;
  sub_columns: sub_column[];
};

type ColumnsProps = {
  // column_ids: { id: number }[];
  id: number;
  position: number;
  project_id: number;
  user_id: string;
};

const Timeline = ({ prjId }: { prjId: string }) => {
  const [droppedItem, setDroppedItem] = useState<MediaItem[]>([]); // media items that will be dropped in timeline will be stored in this state variable
  const [columns, setColumns] = useState<ColumnsProps | undefined>(undefined);
  const [barsData, setBarsData] = useState<BarsProp[]>([]);

  const [barDragging, setBarDragging] = useState<boolean>(false);
  const [fetchBars, setFetchBars] = useState<boolean>(false);

  const isResizing = useRef(false);
  const resizeDirection = useRef<"left" | "right" | null>(null);
  const startX = useRef(0);
  const activeBarId = useRef<number | null>(null);

  const userId = useSelector((state: RootState) => state.userId.userId); // userid has been set in project/uid

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

  const createSubCol = async (parsedItem: MediaItem) => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${columns?.id}/sub-columns`,
      {
        project_id: parsedItem.project_id,
        user_id: parsedItem.user_id,
        parent_id: columns?.id,
        bars: [
          {
            id: Math.floor(Math.random() * 1000000) + (Date.now() % 1000000),
            user_id: parsedItem.user_id,
            name: parsedItem.name,
            left_position: 10, // default left position
            width: 800, // default value
            project_id: parsedItem.project_id,
            type: parsedItem.type,
            signedUrl: parsedItem.signedUrl, // we don't have to store signedurl since it will be newly recreated hourly basis
            filepath: parsedItem.filepath,
          },
        ],
      }
    );
    console.log("create sub col bro:", response.data);
    return response;
  };

  const handleAddBarToCol = async (
    parseditem: MediaItem,
    subColumnId: number
  ) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bars`,
        {
          id: parseditem.id,
          user_id: parseditem.user_id,
          name: parseditem.name,
          left_position: parseditem.left_position,
          width: parseditem.width, // width and left will here be default values and u have to make a req to server to change it
          project_id: parseditem.project_id,
          column_id: subColumnId, // this is only in bars table
          type: parseditem.type,
          signedUrl: parseditem.signedUrl,
          filepath: parseditem.filepath,
        }
      );
      console.log("add bar to col res bro", response.data);
      return response;
    } catch (error) {
      console.log("bar not added to column", error);
    }
  };

  const handleMediaDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped_Item = event.dataTransfer.getData("text/plain"); // the data here is passed from leftpane.tsx using .setData
    const parsedItem = JSON.parse(dropped_Item);
    console.log("media dropped parsed item bro", parsedItem);

    // adding the dropped bar to root column, currently each dropped bar will create it's own sub-column
    try {
      const subColumnResponse = await createSubCol(parsedItem);
      const subColumnId = subColumnResponse.data.id;
      console.log("subcol res", subColumnResponse.data);

      await handleAddBarToCol(subColumnResponse.data.bars[0], subColumnId);
      setFetchBars(true);
    } catch (error) {
      console.error("Error in handling drop:", error);
    }

    // setBarDragging(false);
  };

  useEffect(() => {
    const fetchRootColumn = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${Number(prjId)}`
        );

        const columnData = response.data;
        setColumns(columnData);
        console.log("root col data", [response.data]);
        setBarsData([columnData]);
      } catch (error) {
        console.log(error);
      }
      setFetchBars(false);
    };
    if (prjId) {
      fetchRootColumn();
    }
  }, [prjId, fetchBars]);

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
    left_position: number
  ) => {
    try {
      const subColResponse = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/bars/${id}`,
        {
          left_position,
          width,
        }
      );

      const barResponse = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bars/${id}`,
        {
          width,
          left_position,
        }
      );
    } catch (error) {
      console.error("Failed to update bar:", error);
      throw error;
    }
  };

  const resizeBar = (e: MouseEvent) => {
    if (!isResizing.current || !resizeDirection.current) return;
    const dx = e.clientX - startX.current; // the e.clientx is the current mouse position during the movement of the mouse and we are subtracting it with initial mouse (starting) position during mousedown

    setBarsData((prevRootColumn: BarsProp[]) => {
      return prevRootColumn.map((rootColumn) => {
        return {
          ...rootColumn,
          sub_columns: rootColumn.sub_columns.map((subColumn, index) => {
            return {
              ...subColumn,
              bars: subColumn?.bars?.map((bar, barIndex, bars) => {
                if (bar.id === activeBarId.current) {
                  let newWidth = bar.width;
                  let newLeft = bar.left_position;

                  if (resizeDirection.current === "left") {
                    const minWidth = 125;

                    const minLeft =
                      bar.width === minWidth
                        ? bar.left_position
                        : bar.left_position + dx >= 0
                        ? bar.left_position + dx
                        : 0; // Prevent moving beyond left limit

                    newLeft = minLeft;

                    // Ensure the width doesn't grow when reaching the left gap constraint
                    if (newLeft === 0) {
                      newWidth = Math.max(bar.width - dx, minWidth); // Stop resizing width if at gap
                    } else {
                      newWidth = bar.width - dx;
                    }

                    // Prevent overlap with the previous bar
                    if (barIndex > 0) {
                      for (let i = 0; i < barIndex; i++) {
                        // Only check for previous bars if it's not the first bar
                        const prevBar = bars[barIndex - 1];
                        const minPosition =
                          prevBar.left_position + prevBar.width + 10;

                        if (newLeft < minPosition) {
                          newLeft = minPosition; // Prevent overlap with previous bar
                          newWidth = bar.width - (bar.left_position - newLeft); // Adjust width accordingly
                        }
                      }
                    } else {
                      // For the first bar, set left limit and stop increasing width if the left limit is reached
                      const minLeft = 10; // Prevent moving beyond left limit
                      newLeft = Math.max(newLeft, minLeft); // Set minimum left position
                      if (newLeft === minLeft) {
                        newWidth = bar.width;
                      } else {
                        newWidth = Math.max(newWidth, minWidth); // Ensure minimum width
                      }
                    }
                  } else {
                    // Right handle: prevent overlap with next bar
                    newWidth = bar.width + dx;

                    for (let i = barIndex + 1; i < bars.length; i++) {
                      const nextBar = bars[i];
                      const maxRightPosition = nextBar.left_position - 10;
                      if (newWidth + bar.left_position > maxRightPosition) {
                        newWidth = maxRightPosition - bar.left_position - 10;
                      }
                    }
                  }

                  // Update the database
                  updateItemInDatabase(bar.id, newWidth, newLeft);

                  return {
                    ...bar,
                    width: Math.max(newWidth, 125),
                    left_position: newLeft,
                  };
                }
                return bar;
              }),
            };
          }),
        };
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

  const delBarSubCol = async (draggedBarId: number, dragSubColId: number) => {
    try {
      const delBar = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${dragSubColId}/bars/${draggedBarId}`
      );

      console.log("del bar res", delBar);
      setFetchBars(true);
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  const updateBarSubCol = async (
    draggedBarId: number,
    dropSubColId: number,
    e: React.DragEvent<HTMLDivElement>
  ) => {
    const dragSubColId = e.dataTransfer.getData("dragSubColId");
    try {
      const getBarData = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bars/${draggedBarId}`
      );
      console.log(dropSubColId);
      console.log("dragged bar data bro:", getBarData.data);
      const addBarData = getBarData.data;
      const addBarResponse = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${dropSubColId}`,
        {
          addBarData,
        }
      );

      delBarSubCol(Number(draggedBarId), Number(dragSubColId));
    } catch (error) {
      console.log("updatebarSubcol error", error);
    }
  };

  const handleBarDragStart = (
    draggedBarId: number,
    e: React.DragEvent<HTMLDivElement>,
    dragSubColId: number
  ) => {
    setBarDragging(true);
    const BarId = JSON.stringify(draggedBarId);
    const subColId = JSON.stringify(dragSubColId);
    e.dataTransfer.setData("draggedBarId", BarId); //here converting id(number) to string since setData require data in string
    e.dataTransfer.setData("dragSubColId", subColId);
    console.log("bar drag started bro");
  };

  const handleBarDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow the element to be dropped by preventing the default behavior
    e.preventDefault();
  };

  const handleBarDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropSubColId: number
  ) => {
    const draggedBarId = e.dataTransfer.getData("draggedBarId"); // it is index value since we are passing index of the draggedbar in handleBarDragStart
    // const dragSubColId = e.dataTransfer.getData("dragSubColId");

    console.log(
      "id of drag bar, dropped in subcol :",
      draggedBarId,
      dropSubColId
    );

    // console.log("dragSubcolId bro", dragSubColId);

    updateBarSubCol(Number(draggedBarId), dropSubColId, e);
    // delBarSubCol(Number(draggedBarId), Number(dragSubColId));

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
    dropSubColId: number
  ) => {
    console.log("bardragging state:", barDragging);
    if (barDragging) {
      console.log("u are to run handleBar drop");
      handleBarDrop(e, dropSubColId);
    } else {
      console.log("u are to run handleMediaDrop");
      handleMediaDrop(e);
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
            {(barsData && barsData[0]?.sub_columns === null
              ? new Array(3).fill(null) //now here 3 empty array will be shown when no sub_column will be present(initial state of timeline)
              : barsData[0]?.sub_columns || []
            ).map((item, index) => (
              <div
                className={styles.sub_col_div}
                key={index}
                id={item?.id} // id will contain numeric value for each sub_column
                onDragOver={(e) => handleDynamicDragOver(e)}
                onDrop={(e) => handleDynamicDrop(e, item?.id)}
              >
                {item?.bars?.length > 0 ? (
                  item?.bars?.map((bar: bar, barIndex: number) => (
                    <div
                      className={styles.item_box_div}
                      style={{
                        width: bar?.width ? `${bar.width}px` : "800px",
                        left: bar?.left_position
                          ? `${bar.left_position}px`
                          : "10px",
                      }}
                      key={barIndex}
                    >
                      <div
                        className={
                          barsData[0]?.sub_columns === null
                            ? `${styles.m_item_box}`
                            : `${styles.m_item_box_drop}`
                        }
                      >
                        <div className={styles.bar_content}>
                          {barsData[0]?.sub_columns?.length ? (
                            <div
                              className={styles.bar_arrow}
                              onMouseDown={(e) =>
                                startResize(e, "left", bar?.id)
                              }
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
                              barsData[0]?.sub_columns?.length
                                ? `${styles.item_content_drop}`
                                : ""
                            }
                            draggable
                            onDragStart={(e) =>
                              handleBarDragStart(bar?.id, e, item?.id)
                            }
                            onDragEnd={handleBarDragEnd}
                          >
                            {item && (
                              <div className={styles.m_item_keys}>
                                <div
                                  className={styles.m_item_thumb}
                                  style={{
                                    backgroundImage: bar?.signedUrl
                                      ? `url(${bar?.signedUrl})`
                                      : "none",
                                    backgroundRepeat: "repeat-x",
                                    backgroundSize: "auto 100%",
                                  }}
                                ></div>

                                {bar?.width >= 300 && (
                                  <div className={styles.m_type_label}>
                                    <div className={styles.type_icon}>
                                      {bar?.type in icons && (
                                        <Image
                                          src={
                                            icons[
                                              bar?.type as keyof typeof icons
                                            ]
                                          }
                                          alt={bar?.type}
                                          width={10}
                                          height={10}
                                          priority={true}
                                          draggable={false}
                                        />
                                      )}
                                    </div>
                                    <span className={styles.m_item_label}>
                                      {bar?.name.length > 20
                                        ? `${bar?.name.substring(0, 25)}...`
                                        : bar?.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {barsData[0]?.sub_columns?.length ? (
                            <div
                              className={styles.bar_arrow}
                              onMouseDown={(e) =>
                                startResize(e, "right", bar?.id)
                              }
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
                  ))
                ) : (
                  // this empty bar will be shown when there will be a sub_column without bar i guess and also it checks if there is bar in sub_column than it will show the above truthy structure
                  <div
                    className={`${styles.item_box_div} ${styles.m_item_box}`}
                    style={{ width: "800px", left: "10px" }}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
