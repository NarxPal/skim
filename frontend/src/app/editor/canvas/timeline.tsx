import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import ContextMenu from "@/components/contextMenu";

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
  // usestate hooks
  const [droppedItem, setDroppedItem] = useState<MediaItem[]>([]); // media items that will be dropped in timeline will be stored in this state variable
  const [columns, setColumns] = useState<ColumnsProps | undefined>(undefined); // column and barsdata are having same data
  const [barsData, setBarsData] = useState<BarsProp[]>([]);

  const [barDragging, setBarDragging] = useState<boolean>(false);
  const [fetchBars, setFetchBars] = useState<boolean>(false);
  const [prevBarPosition, setPreviewBarPosition] = useState<number | null>(
    null
  );
  const [draggedOverSubColId, setDraggedOverSubColId] = useState<number | null>(
    null
  );
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    id: number | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    id: null,
  });
  const [options, setOptions] = useState<
    { label: string; action: () => void }[]
  >([]);

  const [barIndex, setBarIndex] = useState<number>();
  const [droppedBarNewLeft, setDroppedBarNewLeft] = useState<number | null>();
  const [LPBasedBars, setLPBasedBars] = useState<bar[]>([]);

  // use ref hooks
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

  const subColDivWidths: number[] = [];

  // const playheadPosition =
  //   timelineRef.current && duration > 0
  //     ? (currentTime / duration) * timelineRef.current.offsetWidth
  //     : 0;

  const createSubCol = async (parsedItem: MediaItem) => {
    // parsedItem contains most of the data for bars but keys like left and width are added during handleaddbartocol
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
            signedUrl: parsedItem.signedUrl, // it's just named as signedurl but it's a public url, so permanent
            filepath: parsedItem.filepath,
            order: 0, // initial value 1 since every new bar will be inside newly created sub_col first
          },
        ],
      }
    );
    console.log("create sub col bro:", response.data);
    return response;
  };

  // to create/add the bar to bars table
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
      const roundedWidth = Math.round(width);
      const roundedLeftPosition = Math.round(left_position);

      const subColResponse = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/bars/${id}`,
        {
          left_position: roundedLeftPosition,
          width: roundedWidth,
        }
      );
      const barResponse = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bars/${id}`,
        {
          width: roundedWidth,
          left_position: roundedLeftPosition,
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
          sub_columns: rootColumn.sub_columns.map((subColumn) => {
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

                  // for scrolling the parent element of bars when bars are resized and get out of view
                  const parentElement = document.querySelector(
                    "#id-1"
                  ) as HTMLElement;
                  if (parentElement) {
                    const barRightEdge = newLeft + newWidth; // Calculate the bar's right edge
                    const parentScrollRight =
                      parentElement.scrollLeft + parentElement.offsetWidth;
                    const buffer = 50; // Pixels of buffer space around the handle

                    if (resizeDirection.current === "right") {
                      if (barRightEdge > parentScrollRight) {
                        parentElement.scrollLeft +=
                          barRightEdge - parentScrollRight; // Scroll parent to the right
                      }
                      if (barRightEdge < parentElement.scrollLeft) {
                        // scroll parent to left
                        parentElement.scrollLeft -=
                          parentElement.scrollLeft - barRightEdge;
                      }
                      // buffer while dragging right handle towards right
                      if (barRightEdge > parentScrollRight - buffer) {
                        parentElement.scrollLeft +=
                          barRightEdge + buffer - parentScrollRight;
                      }
                      if (barRightEdge < parentElement.scrollLeft + buffer) {
                        parentElement.scrollLeft -=
                          parentElement.scrollLeft - (barRightEdge - buffer);
                      }
                    } else if (resizeDirection.current === "left") {
                      // scroll parent to right
                      if (newLeft > parentScrollRight) {
                        parentElement.scrollLeft += newLeft - parentScrollRight;
                      }
                      // scroll parent to left
                      if (newLeft < parentElement.scrollLeft) {
                        parentElement.scrollLeft -=
                          parentElement.scrollLeft - newLeft;
                      }

                      if (newLeft < parentElement.scrollLeft + buffer) {
                        parentElement.scrollLeft -=
                          parentElement.scrollLeft - (newLeft - buffer);
                      }
                      if (newLeft > parentScrollRight - buffer) {
                        parentElement.scrollLeft +=
                          newLeft + buffer - parentScrollRight;
                      }
                    }
                  } else if (!parentElement) {
                    console.error("Parent element not found");
                  }

                  // Update the database
                  // console.log(bar.id, newWidth, newLeft);
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

  // remove draggedbar from it's subcol
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

  // add dragged bar to subcol
  const updateBarSubCol = async (
    draggedBarId: number,
    dropSubColId: number,
    e: React.DragEvent<HTMLDivElement>,
    dragSubColId: number
  ) => {
    try {
      const getBarData = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bars/${draggedBarId}`
      );
      // console.log("barindex, droppedbarnewlp bro", barIndex, droppedBarNewLeft);
      // Update the dragged bar order using targetIndex here and than add it to the dropsubcolid

      const addBarData = getBarData.data;

      // if drag subcol id equal the drop subcolid than don't add the bar, we will use duplicate feature to add the same bar in the same sub_column
      if (Number(dragSubColId) !== dropSubColId) {
        const addBarResponse = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${dropSubColId}`,
          {
            addBarData: { ...addBarData, left_position: droppedBarNewLeft }, // Also updating the left position while adding bar to subcol
            barIndex, // For positioning bars in subcol based upon order values
          }
        );
        setDroppedBarNewLeft(null);
        console.log("drag bar added", addBarResponse);
      }

      // don't delete the subcol if drag and drop sub col id for bar is same
      if (Number(dragSubColId) !== dropSubColId) {
        delBarSubCol(Number(draggedBarId), Number(dragSubColId));
      }
    } catch (error) {
      console.log("updatebarSubcol error", error);
    }
  };

  // updatebarlp updates the left position of the existing bars in sub_col
  const updateBarLP = async (
    draggedBarId: number,
    dropSubColId: number,
    e: React.DragEvent<HTMLDivElement>
  ) => {
    const dragSubColId = e.dataTransfer.getData("dragSubColId");
    // here we are saving the left position present in filteredbars into db
    try {
      const getDraggedBarData = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bars/${draggedBarId}`
      );

      let dragBarLP = getDraggedBarData.data.left_position;
      let dragBarWidth = getDraggedBarData.data.width;

      let increaseSize = dragBarLP + dragBarWidth;
      let totalOffset = increaseSize;

      const updateLPBars = LPBasedBars.map((bar, index) => {
        // LPBasedBars is used to check if there is a single bar or multiple and act accordingly for both
        if (index === 0) {
          // For the first bar, add the initial offset, which is newlp + width
          bar.left_position = droppedBarNewLeft + dragBarWidth + 10; // 10 px for gap
        } else {
          // For subsequent bars, add the previous bar's left_position + width
          const previousBar = LPBasedBars[index - 1];
          totalOffset = previousBar.left_position + previousBar.width + 10;
          bar.left_position = totalOffset;
        }
        return bar;
      });

      if (Number(dragSubColId) !== dropSubColId) {
        const updateBarLPRes = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/updateBarLP/${dropSubColId}`,
          updateLPBars
        );

        console.log("UpdateBarLP response:", updateBarLPRes.data);
        updateBarSubCol(
          Number(draggedBarId),
          dropSubColId,
          e,
          Number(dragSubColId)
        );
      }
    } catch (error) {
      console.error("Error updating bar left positions:", error);
    }
  };

  const getBarsForSubColId = async (dragOverSubColId: number) => {
    try {
      const subColIdBars = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${dragOverSubColId}`
      );
      // console.log("want BARS", subColIdBars.data);
      return subColIdBars.data.bars;
    } catch (error) {
      console.log("subcolid bars fetching error", error);
    }
  };

  const addNewSubCol = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${columns?.id}/sub-columns`,
        {
          project_id: columns?.project_id,
          user_id: columns?.user_id,
          parent_id: columns?.id,
          // bars will be empty here since this new subcol is for creating subcol having no bars
          bars: [],
        }
      );
      console.log("sub col created for empty bars :", response.data);
      setFetchBars(true); // Fetch and show all the sub_col in timeline
      return response;
    } catch (error) {
      console.log("error creating empty subcol", error);
    }
  };

  const calcHoverPosition = async (
    e: React.DragEvent<HTMLDivElement>,
    dragOverSubColId: number
  ): Promise<{ targetIndex: number; leftPosition: number } | null> => {
    const subColElement = document.querySelector(
      `#subcol-${dragOverSubColId}`
    ) as HTMLElement;

    if (!subColElement) {
      console.error("Sub-column element not found");
      return null;
    }

    const relativeX = Math.max(
      0,
      e.clientX - subColElement.getBoundingClientRect().left
    );
    // console.log("relativex", relativeX);

    // Get all the bars data of the dragover sub-column
    const barsInSubCol = await getBarsForSubColId(dragOverSubColId);
    let targetIndex = barsInSubCol?.length; // Default targetIndex would be after the last bar
    let leftPosition = relativeX; // mouse position in sub_col_div
    const previewBarWidth = 70;

    if (barsInSubCol && barsInSubCol.length > 0) {
      if (targetIndex !== undefined) {
        for (let i = 0; i < barsInSubCol.length; i++) {
          const bar = barsInSubCol[i];

          if (relativeX < bar.left_position) {
            // Calculation is always before the bar(before the left handle) since we are calculating everything from left
            targetIndex = i;
            if (i > 0) {
              const previousBar = barsInSubCol[i - 1];

              // Check if there is no space between the bars
              const spaceBetweenBars =
                bar.left_position -
                (previousBar.left_position + previousBar.width); // it will caputre the width and left, this way we get to right handle, and bar.left get the left handle so we get the dist bw them (left handle of one bar right handle of another bar)

              console.log("next bar left position", bar.left_position);
              console.log(
                "yes bro",
                previousBar.left_position + previousBar.width
              );

              // // If no space, create a temporary gap for the preview bar
              // if (spaceBetweenBars < previewBarWidth) {
              //   leftPosition =
              //     previousBar.left_position +
              //     previousBar.width +
              //     spaceBetweenBars / 2;
              //   // console.log("LF FROM CREATE SPACE", leftPosition);
              // } else {
              //   // Position the preview bar halfway between the two bars
              //   leftPosition =
              //     (previousBar.left_position + bar.left_position) / 2; // Preview bar will have the left position which will be the average left and right bar
              //   // console.log('LF FROM HALFWAY ', leftPosition)
              // }
            } else {
              // If it's the first bar(when hovered before all the other bars, basically before first bar), place it at the start
              leftPosition = bar.left_position / 2;
              // console.log('LF FROM LAST ', leftPosition)
            }
            break;
          }
        }

        // If hovering after the last bar, place it at the end
        if (targetIndex === barsInSubCol.length) {
          const lastBar = barsInSubCol[barsInSubCol.length - 1];
          leftPosition = lastBar.left_position + lastBar.width; // Place after the last bar
        }
      }
    }
    console.log("last targetindex", targetIndex);
    setBarIndex(targetIndex);

    // console.log("bro prev bar left", leftPosition);
    return { targetIndex, leftPosition };
  };

  const calcHoverPosition2 = async (
    e: React.DragEvent<HTMLDivElement>,
    dragOverSubColId: number
  ): Promise<{ relativeX: number; targetIndex: number } | null> => {
    const subColElement = document.querySelector(
      `#subcol-${dragOverSubColId}`
    ) as HTMLElement;

    if (!subColElement) {
      console.error("Sub-column element not found");
      return null;
    }

    const relativeX = Math.max(
      0,
      e.clientX - subColElement.getBoundingClientRect().left
    ); // with relativeX is used to know if the dragged bar should occur before or after the existing bar based upon left position

    const barsInSubCol = await getBarsForSubColId(dragOverSubColId);
    let targetIndex = barsInSubCol?.length; // Default targetIndex would be after the last bar
    // console.log("barsubcol len", barsInSubCol);
    if (barsInSubCol && barsInSubCol.length > 0) {
      if (targetIndex !== undefined) {
        for (let i = 0; i < barsInSubCol.length; i++) {
          const bar = barsInSubCol[i];
          if (relativeX < bar.left_position) {
            // Calculation is always before the bar(before the left handle) since we are calculating everything from left
            targetIndex = i;
            break;
          }
        }
      }
    }
    // math round for relativeX since db doesn't accept integer with decimal
    return { relativeX: Math.round(relativeX), targetIndex };
  };

  const createTemporarySpace = async (
    barsInSubCol: bar[],
    targetIndex: number,
    previewBarWidth: number
  ) => {
    if (barsInSubCol?.length > 0 && targetIndex < barsInSubCol.length) {
      // Shift the target bar and all bars after it
      for (let i = targetIndex; i < barsInSubCol.length; i++) {
        const barElement = document.querySelector(
          `#bar-${barsInSubCol[i].id}`
        ) as HTMLElement;
        if (barElement) {
          barElement.style.left = `${
            barsInSubCol[i].left_position + previewBarWidth
          }px`;
        }
      }
    }
  };

  const delCmSubColId = async (subColId: number) => {
    try {
      const delSubCol = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${subColId}`
      );

      console.log("del bar res", delSubCol);
      setFetchBars(true);
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  const delCmBarId = async (cmSubColId: number, cmBarName: string) => {
    console.log("cmsubcolid, cmbarname,", cmSubColId, cmBarName);
    try {
      const delBar = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${cmSubColId}/bars/${cmBarName}`
      );

      console.log("cm del bar res", delBar);
      setFetchBars(true);
    } catch (error) {
      console.log("error deleting bar", error);
    }
  };

  // ********** context menu functions ************

  const handleRightClickBar = (
    e: React.MouseEvent<HTMLDivElement>,
    bar: bar,
    id: number,
    subColId: number
  ) => {
    e.preventDefault();
    setOptions([
      { label: "edit", action: () => console.log(`Edit ${bar.name}`) },
      { label: "delete", action: () => delCmBarId(subColId, bar.name) },
    ]);
    const container = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: e.clientX - container.left,
      y: e.clientY - container.top,
      id: id,
    });
  };

  const handleRightClickSubCol = (
    e: React.MouseEvent<HTMLDivElement>,
    subColId: number
  ) => {
    e.preventDefault();
    setOptions([
      { label: "edit", action: () => console.log(`Edit ${subColId}`) },
      { label: "delete", action: () => delCmSubColId(subColId) },
    ]);
    const container = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: e.clientX - container.left,
      y: e.clientY - container.top,
      id: subColId,
    });
  };

  const handleOptionClick = (option: {
    label: string;
    action: (id: number) => void;
  }) => {
    console.log("option click id", contextMenu.id);
    if (contextMenu.id !== null) {
      option.action(contextMenu.id);
      console.log("option click id", contextMenu.id);
    }
    setContextMenu({ visible: false, x: 0, y: 0, id: null });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, id: null });
  };

  // *********** drag and drop functions ***************
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // setBarDragging(false);
  };

  const handleBarDragOver = async (
    e: React.DragEvent<HTMLDivElement>,
    dragOverSubColId: number
  ) => {
    // Allow the element to be dropped by preventing the default behavior
    e.preventDefault();
    const result = await calcHoverPosition2(e, dragOverSubColId);

    // const draggedBarId = e.dataTransfer.getData("draggedBarId");
    // console.log("draggedbar id bro", draggedBarId);
    if (result) {
      // const { targetIndex, leftPosition } = result;
      // if (leftPosition && targetIndex !== null) {
      //   setPreviewBarPosition(leftPosition);
      //   const barsInSubCol = await getBarsForSubColId(dragOverSubColId);
      //   createTemporarySpace(barsInSubCol, targetIndex, 50);
      // }
      const { relativeX, targetIndex } = result;
      setBarIndex(targetIndex);
      const barsInSubCol: bar[] = await getBarsForSubColId(dragOverSubColId);
      const leftPositions: number[] = barsInSubCol?.map(
        (bar: bar) => bar.left_position
      );

      let newLeftPosition: number | undefined = undefined;

      if (barsInSubCol === undefined || barsInSubCol?.length === undefined) {
        setDroppedBarNewLeft(relativeX);
      } else {
        for (let i = 0; i < leftPositions?.length; i++) {
          if (
            barsInSubCol.length === 1 &&
            relativeX > barsInSubCol[0].left_position
          ) {
            // taking lp + width of the single bar present in subcol as newlp
            newLeftPosition =
              barsInSubCol[0].left_position + barsInSubCol[0].width + 10; //10 px for gap
            setDroppedBarNewLeft(newLeftPosition);
            break;
          } else if (
            barsInSubCol.length === 1 &&
            relativeX < barsInSubCol[0].left_position
          ) {
            // when hovering left side of the single bar this elif is used
            newLeftPosition = relativeX;
            setDroppedBarNewLeft(newLeftPosition);
            break;
          }
          // relativex is used to find left position for the dropped bar
          else if (relativeX < leftPositions[i]) {
            newLeftPosition = leftPositions[i]; // taking the lp of bar using index ,where condition meet
            setDroppedBarNewLeft(newLeftPosition);
            break;
          }
        }
      }

      // shift all bars with left_position >= newLeftPosition, until this the dragged bar should not be added into the subcol otherwise it's lp will also be changed (hence we are doing updatebarsubcol after updateBarLP)
      if (newLeftPosition !== undefined) {
        const filteredBars = barsInSubCol
          .filter((bar) => bar.left_position >= newLeftPosition)
          .map((bar) => ({
            ...bar,
            // dragged bar left p. + width, should be added to each bar present in filtered bars,done in updateBarLP
          }));

        // console.log(">= filter bars after lp addition", filteredBars);
        setLPBasedBars(filteredBars);
      }

      setPreviewBarPosition(relativeX);
    } else {
      console.error("Hover position could not be calculated");
    }
  };

  const handleBarDragStart = async (
    draggedBarId: number,
    e: React.DragEvent<HTMLDivElement>,
    dragSubColId: number
  ) => {
    setBarDragging(true);
    const BarId = JSON.stringify(draggedBarId);
    const subColId = JSON.stringify(dragSubColId);
    e.dataTransfer.setData("draggedBarId", BarId); //here converting id(number) to string since setData require data in string
    e.dataTransfer.setData("dragSubColId", subColId);
  };

  const handleBarDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropSubColId: number
  ) => {
    const draggedBarId = e.dataTransfer.getData("draggedBarId"); // it is index value since we are passing index of the draggedbar in handleBarDragStart

    updateBarLP(Number(draggedBarId), dropSubColId, e); // this will update all the existing bars lp in subcol which are >= newLeftPosition

    setBarDragging(false);
    setDraggedOverSubColId(null);
  };

  const resetBarPositions = async (
    barsInSubCol: bar[],
    dragOverSubColId: number,
    dropSubColId: number
  ) => {
    if (
      dragOverSubColId === dropSubColId &&
      dragOverSubColId !== null &&
      dropSubColId !== null
    ) {
      barsInSubCol?.forEach((bar) => {
        const barElement = document.querySelector(
          `#bar-${bar.id}`
        ) as HTMLElement;
        if (barElement) {
          barElement.style.left = `${bar.left_position}px`;
        }
      });
      setPreviewBarPosition(null);
      // deleteTemporarySpace();
    }
  };

  const handleBarDragEnd = async (dragOverSubColId: number) => {
    setBarDragging(false);

    // const barsInSubCol = await getBarsForSubColId(dragOverSubColId);
    // console.log("barsinsubcol bro", barsInSubCol);
    // resetBarPositions(dragOverSubColId);
  };

  const handleDynamicDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropSubColId: number
  ) => {
    if (barDragging) {
      handleBarDrop(e, dropSubColId);
      // resetBarPositions(dropSubColId)
    } else {
      handleMediaDrop(e);
    }
  };

  const handleDynamicDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    dragOverSubColId: number
  ) => {
    if (barDragging) {
      handleBarDragOver(e, dragOverSubColId);
      setDraggedOverSubColId(dragOverSubColId);
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

          <div className={styles.tm_icon} onClick={() => addNewSubCol()}>
            <Image
              src="/column.png"
              width={15}
              height={15}
              alt="column"
              priority={true}
              draggable={false}
            />
          </div>
        </div>
      </div>

      <div className={styles.media_parent_div}>
        <div onClick={() => closeContextMenu()} className={styles.closeMenuDiv}>
          <div className={styles.tm_media_container} id={"id-1"}>
            {((barsData && barsData[0]?.sub_columns === null) ||
            barsData[0]?.sub_columns.length === 0
              ? new Array(3).fill(null) //now here 3 empty array will be shown when no sub_column will be present(initial state of timeline)
              : barsData[0]?.sub_columns || []
            ).map((item, index) => {
              return (
                <div
                  className={styles.sub_col_div}
                  key={index}
                  id={`subcol-${item?.id}`} // id will contain numeric value for each sub_column
                  onDragOver={(e) => handleDynamicDragOver(e, item?.id)}
                  onDrop={(e) => handleDynamicDrop(e, item?.id)}
                >
                  {prevBarPosition !== null &&
                    draggedOverSubColId === item?.id && (
                      <div
                        className={styles.previewBar}
                        style={{
                          left: `${prevBarPosition}px`,
                        }}
                      />
                    )}
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
                        id={`bar-${bar?.id}`}
                        onContextMenu={(e) =>
                          handleRightClickBar(e, bar, bar?.id, item?.id)
                        } // here we are passing bar info
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
                              onDragEnd={() => handleBarDragEnd(item?.id)}
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

                        {contextMenu.visible && contextMenu.id == bar?.id && (
                          <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            id={contextMenu.id}
                            options={options}
                            onOptionClick={handleOptionClick}
                            visible={contextMenu.visible}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    // this empty bar will be shown when there will be a sub_column without bar i guess and also it checks if there is bar in sub_column than it will show the above truthy structure
                    <div
                      className={`${styles.item_box_div} ${styles.m_item_box}`}
                      style={{ width: "100%", left: "0px" }}
                      onContextMenu={
                        (e) =>
                          item?.id !== undefined
                            ? handleRightClickSubCol(e, item?.id)
                            : null // don't show cm when sub_col_div have id subcol-undefined
                      } // id here refers to the sub_col id and not bars id
                    >
                      {contextMenu.visible && contextMenu.id == item?.id && (
                        <ContextMenu
                          x={contextMenu.x}
                          y={contextMenu.y}
                          id={contextMenu.id}
                          options={options}
                          onOptionClick={handleOptionClick}
                          visible={contextMenu.visible}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
