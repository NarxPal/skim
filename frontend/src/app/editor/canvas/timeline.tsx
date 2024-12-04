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

        console.log("fetch root column bro", response.data);
        const columnData = response.data;
        setColumns(columnData);
        console.log("bars data", [response.data]);
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
              bars: subColumn.bars.map((bar) => {
                if (bar.id === activeBarId.current) {
                  const newWidth =
                    resizeDirection.current === "left"
                      ? bar.left_position === 0
                        ? bar.width
                        : bar.width - dx
                      : bar.width + dx;

                  const newLeft =
                    resizeDirection.current === "left"
                      ? Math.max(bar.left_position + dx, 0)
                      : bar.left_position;

                  // Update the database
                  updateItemInDatabase(bar.id, newWidth, newLeft);

                  return {
                    ...bar,
                    width: Math.max(newWidth, 125),
                    left_position: newLeft, // Use correct key here
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
              ? new Array(3).fill(null)
              : barsData[0]?.sub_columns || []
            ).map((item, index) => (
              <div
                // className={styles.item_box_div}
                key={index}
                id={item?.id} // id will contain numeric value for each columns
                onDragOver={(e) => handleDynamicDragOver(e)}
                onDrop={(e) => handleDynamicDrop(e, index.toString())}
              >
                <div
                  className={styles.item_box_div}
                  style={{
                    width: item?.bars?.[0]?.width
                      ? `${item.bars[0].width}px`
                      : "800px",
                    left: item?.bars?.[0]?.left_position
                      ? `${item.bars[0].left_position}px`
                      : "10px",
                  }}
                >
                  <div
                    className={
                      barsData[0]?.sub_columns?.length
                        ? `${styles.m_item_box_drop}`
                        : `${styles.m_item_box}`
                    }
                  >
                    <div className={styles.bar_content}>
                      {barsData[0]?.sub_columns?.length ? (
                        <div
                          className={styles.bar_arrow}
                          onMouseDown={(e) =>
                            startResize(e, "left", item.bars[0]?.id)
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
                        onDragStart={(e) => handleBarDragStart(index, e)}
                        onDragEnd={handleBarDragEnd}
                      >
                        {item && (
                          <div className={styles.m_item_keys}>
                            <div
                              className={styles.m_item_thumb}
                              style={{
                                backgroundImage: item.bars[0]?.signedUrl
                                  ? `url(${item.bars[0].signedUrl})`
                                  : "none",
                                backgroundRepeat: "repeat-x",
                                backgroundSize: "auto 100%",
                              }}
                            ></div>

                            {item.bars[0]?.width >= 300 && (
                              <div className={styles.m_type_label}>
                                <div className={styles.type_icon}>
                                  {item.bars[0]?.type in icons && (
                                    <Image
                                      src={
                                        icons[
                                          item.bars[0]
                                            .type as keyof typeof icons
                                        ]
                                      }
                                      alt={item.bars[0].type}
                                      width={10}
                                      height={10}
                                      priority={true}
                                      draggable={false}
                                    />
                                  )}
                                </div>
                                <span className={styles.m_item_label}>
                                  {item.bars[0]?.name.length > 20
                                    ? `${item.bars[0].name.substring(0, 25)}...`
                                    : item.bars[0]?.name}
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
                            startResize(e, "right", item.bars[0]?.id)
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
