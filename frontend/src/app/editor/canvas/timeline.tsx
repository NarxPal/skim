import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";
import axios from "axios";
import ContextMenu from "@/components/contextMenu";
import TimelineRuler from "@/utils/timeline/timelineRuler";
import Playhead from "@/utils/timeline/playhead";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";

// types / interfaces import
import { BarsProp, bar } from "@/interfaces/barsProp";

type MediaItem = {
  name: string;
  filepath: string;
  type: string;
  id: number;
  column: number;
  width: number;
  left_position: number;
  user_id: string;
  project_id: number;
  duration: number;
  url: string;
  thumbnail_url: string;
};

type ColumnsProps = {
  // column_ids: { id: number }[];
  id: number;
  position: number;
  project_id: number;
  user_id: string;
};

interface TimelineProps {
  prjId: string;
  canvasHeight: number;
  barsDataChangeAfterZoom: BarsProp | null;
  setBarsDataChangeAfterZoom: React.Dispatch<
    React.SetStateAction<BarsProp | null>
  >;
  mediaContainerWidth: number;
  setMediaContainerWidth: React.Dispatch<React.SetStateAction<number>>;
  totalMediaDuration: number;
  setTotalMediaDuration: React.Dispatch<React.SetStateAction<number>>;
  position: number;
  setPosition: React.Dispatch<React.SetStateAction<number>>;
  showPhTime: string;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const Timeline: React.FC<TimelineProps> = ({
  prjId,
  canvasHeight,
  barsDataChangeAfterZoom,
  setBarsDataChangeAfterZoom,
  mediaContainerWidth,
  setMediaContainerWidth,
  totalMediaDuration,
  setTotalMediaDuration,
  position,
  setPosition,
  showPhTime,
  setShowPhTime,
  videoRef,
}) => {
  // redux state hooks
  // const userId = useSelector((state: RootState) => state.userId.userId); // userid has been set in project/uid
  const phPosition = useSelector(
    (state: RootState) => state.phPosition.phPosition
  );

  // usestate hooks
  const [columns, setColumns] = useState<ColumnsProps | undefined>(undefined); // column and barsdata are having same data
  const [barsData, setBarsData] = useState<BarsProp | null>(null);
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
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // use ref hooks
  const isResizing = useRef(false);
  const resizeDirection = useRef<"left" | "right" | null>(null);
  const startX = useRef(0);
  const activeBarId = useRef<number | null>(null);
  const mediaParentRef = useRef<HTMLDivElement | null>(null);
  const phLeftRef = useRef<HTMLDivElement>(null);

  // redux hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  const icons: { [key: string]: string } = {
    audio: "/audio.png",
    video: "/video.png",
    image: "/image.png",
    text: "/text.png",
  };

  // Update the scrollleft of media_parent_div when playhead moves out of view
  useEffect(() => {
    if (phLeftRef.current && mediaParentRef.current) {
      const playheadBounds = phLeftRef.current.getBoundingClientRect();
      const parentBounds = mediaParentRef.current.getBoundingClientRect();
      if (
        playheadBounds.left < parentBounds.left ||
        playheadBounds.right > parentBounds.right
      ) {
        const scrollOffset = playheadBounds.left - parentBounds.left;
        mediaParentRef.current.scrollLeft += scrollOffset;
      }
    }
  }, [phPosition, position]);

  const handleScroll = () => {
    if (mediaParentRef.current) {
      setScrollPosition(mediaParentRef.current.scrollLeft);
    }
  };

  useEffect(() => {
    if (mediaParentRef.current) {
      const mediaParent = mediaParentRef.current;
      mediaParent.addEventListener("scroll", handleScroll);

      return () => {
        mediaParent.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // create sub col for columns entity in db
  const createSubCol = async (parsedItem: MediaItem) => {
    // parsedItem contains most of the data for bars but keys like left and width are added during handleaddbartocol

    const singleTickPxValue = mediaContainerWidth / totalMediaDuration; // equal px value for each marker, it changes based upon zoom level

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
            left_position: 0, // default left position
            width: (parsedItem.duration / markerInterval) * singleTickPxValue, // duration of the media, for zoom level 1 multiplying 10 since each sec would be 10px/sec, this would work well only for zoom level 1
            duration: parsedItem.duration, // storing duration to use in calcContainerWidth
            project_id: parsedItem.project_id,
            type: parsedItem.type,
            thumbnail_url: parsedItem.thumbnail_url,
            filepath: parsedItem.filepath,
            order: 0, // initial value 0 since every new bar will be inside newly created sub_col first
            url: parsedItem.url,
            start_time: 0,
            end_time: parsedItem.duration,
          },
        ],
      }
    );
    console.log("create sub col bro:", response.data);
    return response;
  };

  const handleMediaDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped_Item = event.dataTransfer.getData("text/plain"); // the data here is passed from leftpane.tsx using .setData
    const parsedItem = JSON.parse(dropped_Item);
    console.log("media dropped parsed item bro", parsedItem);

    // adding the dropped bar to root column, currently each dropped bar will create it's own sub-column
    try {
      await createSubCol(parsedItem);
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
        setBarsData(columnData);
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

      setBarsData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sub_columns: prev.sub_columns?.map((subCol) => {
            return {
              ...subCol,
              bars: subCol?.bars?.map((bar) => {
                if (bar.id === id) {
                  return {
                    ...bar,
                    left_position: roundedLeftPosition,
                    width: roundedWidth,
                  };
                }
                return bar;
              }),
            };
          }),
        };
      });
    } catch (error) {
      console.error("Failed to update bar:", error);
      throw error;
    }
  };

  const resizeBar = (e: MouseEvent) => {
    if (!isResizing.current || !resizeDirection.current) return;
    const dx = e.clientX - startX.current; // the e.clientx is the current mouse position during the movement of the mouse and we are subtracting it with initial mouse (starting) position during mousedown
    setBarsDataChangeAfterZoom((prevRootColumn: BarsProp | null) => {
      if (!prevRootColumn) return null;
      return {
        ...prevRootColumn,
        sub_columns: prevRootColumn.sub_columns?.map((subColumn) => {
          return {
            ...subColumn,
            bars: subColumn?.bars?.map((bar, barIndex, bars) => {
              if (bar.id === activeBarId.current) {
                let newWidth = bar.width;
                let newLeft = bar.left_position;

                let startTime = 0; // to newly created media from 0
                let endTime = 0; // value for end clip

                // singleTickPxValue used in newWidth variable
                const singleTickPxValue =
                  mediaContainerWidth / totalMediaDuration; // equal px value for each marker, it changes based upon zoom level
                const pixelValuePerStep = singleTickPxValue / markerInterval;

                const maxWidth =
                  (bar.duration / markerInterval) * singleTickPxValue;

                // LEFT HANDLE:
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
                    newWidth = Math.max(bar.width - dx, minWidth);
                    startTime = 0; // for first clip media start time duration falls to zero if newleft eq zero
                  } else {
                    newWidth = Math.min(
                      Math.max(bar.width - dx, minWidth),
                      maxWidth
                    );
                    // only calc startime when width is availbale, based upon duration
                    if (bar.width !== maxWidth) {
                      // startTime = bar.start_time + dx; //its px value but we want time in sec
                      startTime = bar.left_position / pixelValuePerStep;
                    }
                  }

                  // Prevent overlap with the previous bar
                  if (barIndex > 0) {
                    for (let i = 0; i < barIndex; i++) {
                      // Only check for previous bars if it's not the first bar
                      const prevBar = bars[barIndex - 1];
                      const minPosition =
                        prevBar.left_position + prevBar.width + 2;

                      if (newLeft < minPosition) {
                        newLeft = minPosition; // Prevent overlap with previous bar
                        newWidth = bar.width - (bar.left_position - newLeft); // Adjust width accordingly
                      }
                    }
                  } else {
                    // For the first bar, set left limit and stop increasing width(showing effect where right handle increases) if the left limit is reached
                    const minLeft = 0; // Prevent moving beyond left limit
                    newLeft = Math.max(newLeft, minLeft); // Set minimum left position
                    if (newLeft === minLeft) {
                      newWidth = bar.width;
                    } else {
                      newWidth = Math.max(newWidth, minWidth); // Ensure minimum width
                    }
                  }

                  if (newWidth === maxWidth) {
                    // if width equals duration than don't grow the clip
                    newLeft = bar.left_position; // fallback to last lp
                  }
                }

                // RIGHT HANDLE :
                else {
                  newWidth = Math.min(bar.width + dx, maxWidth);
                  if (bar.width !== maxWidth) {
                    // only calc endtime when width is avilable based upon duration
                    // endTime = bar.end_time - dx; // neg for pointer moving left for right handle
                    endTime = bar.width / pixelValuePerStep;
                    console.log("media clip end duration", endTime);
                  }

                  // Right handle: prevent overlap with next bar
                  for (let i = barIndex + 1; i < bars.length; i++) {
                    // +1 for working with next bar
                    const nextBar = bars[i];
                    const maxRightPosition = nextBar.left_position - 2;
                    if (newWidth + bar.left_position > maxRightPosition) {
                      newWidth = maxRightPosition - bar.left_position - 2;
                    }
                  }
                }
                console.log("start time bro", startTime);
                return {
                  ...bar,
                  width: Math.max(newWidth, 125),
                  left_position: newLeft,
                  start_time: startTime,
                  end_time: endTime,
                };
              }
              return bar;
            }),
          };
        }),
      };
    });

    startX.current = e.clientX;
  };

  const updateBarAfterResize = async () => {};

  const stopResize = () => {
    isResizing.current = false;
    resizeDirection.current = null;
    console.log("barsdataaz resize bro", barsDataChangeAfterZoom); // save into  db add here
    updateBarAfterResize();
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${dragSubColId}/bars/${draggedBarId}`
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

  // updatebarlp updates the left position of the existing bars in sub_col during bar drop from subcol
  const updateBarLP = async (
    draggedBarId: number,
    dropSubColId: number,
    e: React.DragEvent<HTMLDivElement>
  ) => {
    const dragSubColId = e.dataTransfer.getData("dragSubColId");
    // here we are saving the left position present in filteredbars into db
    try {
      const getDraggedBarData = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${dragSubColId}/bars/${draggedBarId}`
      );

      const dragBarWidth = getDraggedBarData.data.width;
      console.log("draggedbardata bro", getDraggedBarData.data);

      const BAR_GAP = 10;
      const updateLPBars = LPBasedBars.map((bar, index) => {
        const newLeftPosition =
          index === 0
            ? // For the first bar, add the initial offset, which is newlp + width
              droppedBarNewLeft + dragBarWidth + BAR_GAP
            : // For subsequent bars, add the previous bar's left_position + width
              LPBasedBars[index - 1].left_position +
              LPBasedBars[index - 1].width +
              BAR_GAP;

        return { ...bar, left_position: newLeftPosition };
      });
      console.log("updtaelbbar bro", updateLPBars);
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

  // const createTemporarySpace = async (
  //   barsInSubCol: bar[],
  //   targetIndex: number,
  //   previewBarWidth: number
  // ) => {
  //   if (barsInSubCol?.length > 0 && targetIndex < barsInSubCol.length) {
  //     // Shift the target bar and all bars after it
  //     for (let i = targetIndex; i < barsInSubCol.length; i++) {
  //       const barElement = document.querySelector(
  //         `#bar-${barsInSubCol[i].id}`
  //       ) as HTMLElement;
  //       if (barElement) {
  //         barElement.style.left = `${
  //           barsInSubCol[i].left_position + previewBarWidth
  //         }px`;
  //       }
  //     }
  //   }
  // };

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

  // ****** zoom in out ***********
  useEffect(() => {
    const calcContainerWidth = async () => {
      console.log("barsdata[0]", barsData);
      const totalDuration =
        barsData?.sub_columns?.reduce((acc, subCol) => {
          const subColBars = subCol?.bars || [];
          return (
            acc +
            subColBars.reduce((sum, bar) => {
              sum += bar.duration || 0;
              return sum;
            }, 0) // sum is reset to 0
          );
        }, 0) || 0; // if sub_columns is undefined default to 0 value
      let containerWidth = 0;

      if (zoomLevel >= 10) {
        containerWidth = totalDuration * 100; // making 100px per sec for zoom level 10
      } else if (zoomLevel >= 8) {
        containerWidth = totalDuration * 80;
      } else if (zoomLevel >= 5) {
        containerWidth = totalDuration * 80;
      } else if (zoomLevel >= 2) {
        containerWidth = totalDuration * 80;
      } else {
        containerWidth = totalDuration * 80;
      }

      setTotalMediaDuration(totalDuration); // used for timelineRuler
      console.log("total duration bro", totalDuration);
      console.log("zoom level bro", zoomLevel);
      setMediaContainerWidth(containerWidth);
    };
    calcContainerWidth();
  }, [columns, zoomLevel]); // using columns here since setbarsdata will change everytime during resize bar

  const zoom_In = async () => {
    const MAX_ZOOM_LEVEL = 0; // Max zoom is 0
    if (zoomLevel !== 0) {
      console.log("zooom in", zoomLevel);
      setZoomLevel((prev) => Math.max(prev - 2, MAX_ZOOM_LEVEL));
      setFetchBars(true); // it will fetch the barsData which will run the useEffect calcTicks in timelineruler file
    }
  };

  const zoom_Out = async () => {
    const MIN_ZOOM_LEVEL = 10; // High value mean less zoom
    if (zoomLevel >= 0 && zoomLevel < 10) {
      console.log("zooom out", zoomLevel);
      setZoomLevel((prev) => Math.min(prev + 2, MIN_ZOOM_LEVEL));
      setFetchBars(true);
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
    const result = await calcHoverPosition(e, dragOverSubColId);

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
    console.log("bro drabar id ", BarId);
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

  // const resetBarPositions = async (
  //   barsInSubCol: bar[],
  //   dragOverSubColId: number,
  //   dropSubColId: number
  // ) => {
  //   if (
  //     dragOverSubColId === dropSubColId &&
  //     dragOverSubColId !== null &&
  //     dropSubColId !== null
  //   ) {
  //     barsInSubCol?.forEach((bar) => {
  //       const barElement = document.querySelector(
  //         `#bar-${bar.id}`
  //       ) as HTMLElement;
  //       if (barElement) {
  //         barElement.style.left = `${bar.left_position}px`;
  //       }
  //     });
  //     setPreviewBarPosition(null);
  //     // deleteTemporarySpace();
  //   }
  // };

  const handleBarDragEnd = async () => {
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
    <div
      className={styles.timeline}
      style={{ height: `calc(${100 - canvasHeight}% - 4px)` }}
    >
      <div className={styles.tm_top}>
        <div className={styles.top_icons}>
          <div className={styles.tm_icon_div}>
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

          <div className={styles.ph_time_div}>
            <div>{showPhTime}</div>
          </div>

          <div className={styles.top_r_icons}>
            <div
              className={`${styles.tm_icon} ${
                zoomLevel == 0 ? "opacity-50" : ""
              }`}
              onClick={() => zoom_In()}
            >
              <Image
                src="/zoom_in.png"
                width={15}
                height={15}
                alt="zoom"
                priority={true}
                draggable={false}
              />
            </div>

            <div
              className={`${styles.tm_icon} ${
                zoomLevel == 10 ? "opacity-50" : ""
              }`}
              onClick={() => zoom_Out()}
            >
              <Image
                src="/zoom-out.png"
                width={15}
                height={15}
                alt="zoom"
                priority={true}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.ruler_media}>
        <Playhead
          setScrollPosition={setScrollPosition}
          scrollPosition={scrollPosition}
          phLeftRef={phLeftRef}
          mediaContainerWidth={mediaContainerWidth}
          position={position}
          setPosition={setPosition}
          videoRef={videoRef}
          totalDuration={totalMediaDuration}
          setShowPhTime={setShowPhTime}
        />

        <TimelineRuler
          totalDuration={totalMediaDuration}
          zoomLevel={zoomLevel}
          containerWidth={mediaContainerWidth}
          scrollPosition={scrollPosition}
          setBarsDataChangeAfterZoom={setBarsDataChangeAfterZoom}
          barsData={barsData}
          videoRef={videoRef}
          setShowPhTime={setShowPhTime}
        />
        <div className={styles.media_parent_div} ref={mediaParentRef}>
          <div
            onClick={() => closeContextMenu()}
            className={styles.closeMenuDiv}
          >
            <div
              className={styles.tm_media_container}
              id={"id-1"}
              style={{ width: `${mediaContainerWidth}px` }}
            >
              {((barsData && barsData.sub_columns === null) ||
              barsData?.sub_columns?.length === 0
                ? new Array(3).fill(null) //now here 3 empty array will be shown when no sub_column will be present(initial state of timeline)
                : barsData?.sub_columns || []
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
                      item?.bars?.map((bar: bar, barIndex: number) => {
                        // todo: optimize the barwidth here used as width since dropping media into timeline have a flicker due to first width shown is from barsData and than barsDataChangeAfterZoom
                        const barWidth =
                          (barsDataChangeAfterZoom &&
                            barsDataChangeAfterZoom.sub_columns
                              .flatMap((subCol) => subCol.bars)
                              .find((zoomBar) => zoomBar?.id === bar.id)
                              ?.width) ||
                          bar.width;

                        const barLP =
                          (barsDataChangeAfterZoom &&
                            barsDataChangeAfterZoom.sub_columns
                              .flatMap((subCol) => subCol.bars)
                              .find((zoomBar) => zoomBar?.id === bar.id)
                              ?.left_position) ||
                          bar.left_position;

                        return (
                          <div
                            className={styles.item_box_div}
                            style={{
                              width: barWidth, // width according to stored in db and zoom level
                              left: barLP,
                            }}
                            key={barIndex}
                            id={`bar-${bar?.id}`}
                            onContextMenu={(e) =>
                              handleRightClickBar(e, bar, bar?.id, item?.id)
                            } // here we are passing bar info
                          >
                            <div
                              className={`${
                                barsData?.sub_columns === null
                                  ? `${styles.m_item_box}`
                                  : `${styles.m_item_box_drop}`
                              } group`}
                            >
                              <div
                                className={
                                  barsData?.sub_columns?.length
                                    ? `${styles.item_content_drop}`
                                    : ""
                                }
                              >
                                {item && (
                                  <div className={styles.m_item_keys}>
                                    <div
                                      className={styles.m_item_thumb}
                                      style={{
                                        backgroundImage: bar?.thumbnail_url
                                          ? `url(${bar?.thumbnail_url})`
                                          : "none",
                                        backgroundRepeat: "repeat-x",
                                        backgroundSize: "auto 100%",
                                      }}
                                    ></div>
                                  </div>
                                )}
                              </div>

                              {/* only show barcontent (bar arrow and label) when width of bar is above 125 */}
                              {(barWidth || bar?.width) > 125 && (
                                <div className={styles.bar_content}>
                                  {barsData?.sub_columns?.length ? (
                                    <div
                                      className={`${styles.bar_arrow_left} hidden group-hover:flex`}
                                      onMouseDown={(e) =>
                                        startResize(e, "left", bar?.id)
                                      }
                                    >
                                      <div className={styles.arrow_pad}>
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
                                    </div>
                                  ) : null}

                                  {barWidth >= 300 && (
                                    <div
                                      className={styles.clip_center}
                                      draggable
                                      onDragStart={(e) =>
                                        handleBarDragStart(bar?.id, e, item?.id)
                                      }
                                      onDragEnd={() => handleBarDragEnd()}
                                    >
                                      <div
                                        className={`${styles.m_type_label} hidden group-hover:flex`}
                                      >
                                        <div
                                          className={styles.type_label_content}
                                        >
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
                                              />
                                            )}
                                          </div>
                                          <span className={styles.m_item_label}>
                                            {bar?.name.length > 20
                                              ? `${bar?.name.substring(
                                                  0,
                                                  25
                                                )}...`
                                              : bar?.name}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {barsData?.sub_columns?.length ? ( // length check if there are bars in sub_columns
                                    <div
                                      className={`${styles.bar_arrow_right} hidden group-hover:flex`}
                                      onMouseDown={(e) =>
                                        startResize(e, "right", bar?.id)
                                      }
                                    >
                                      <div className={styles.arrow_pad}>
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
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {contextMenu.visible &&
                              contextMenu.id == bar?.id && (
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
                        );
                      })
                    ) : (
                      // this empty bar will be shown when there will be a sub_column without bar i guess and also it checks if there is bar in sub_column than it will show the above truthy structure
                      <div
                        className={`${styles.item_box_div} ${styles.m_item_box}`}
                        style={{ width: "1000px", left: "0px" }}
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
    </div>
  );
};

export default Timeline;
