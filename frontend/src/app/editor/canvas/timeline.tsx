import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";
import axios from "axios";
import TimelineRuler from "@/utils/timeline/timelineRuler";
import Playhead from "@/utils/timeline/playhead";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useSprings } from "@react-spring/web";

// types / interfaces import
import { BarsProp, sub_column, bar } from "@/interfaces/barsProp";
import Clip from "@/components/clip";

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
  const [gapData, setGapData] = useState<BarsProp | null>(null);
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
  const [barIndex, setBarIndex] = useState<number>();
  const [droppedBarNewLeft, setDroppedBarNewLeft] = useState<number | null>();
  const [LPBasedBars, setLPBasedBars] = useState<bar[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [hoveringOverRow, setHoveringOverRow] = useState<boolean>(false);
  const [updateBarsData, setUpdateBarsData] = useState<boolean>(false);

  // use ref hooks
  const isResizing = useRef(false);
  const resizeDirection = useRef<"left" | "right" | null>(null);
  const startX = useRef(0);
  const activeBarId = useRef<number | null>(null);
  const mediaParentRef = useRef<HTMLDivElement | null>(null);
  const phLeftRef = useRef<HTMLDivElement>(null);
  const addSubColRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  // redux hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

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

  // use gesture and spring
  const allBars = barsData?.sub_columns?.flatMap((subCol) => subCol.bars) || [];
  const [springs, api] = useSprings(
    allBars.length || 0,
    (i) => ({
      barID: allBars[i].id,
      subColId: allBars[i].sub_col_id,
      clipTop: 0,
      clipLP: allBars[i].left_position || 0, // initial lp
      clipWidth: allBars[i].width || 0, // initial width
      zIndex: 1,
      config: { tension: 300, friction: 30 }, // smooth animation
      immediate: true,
    }),
    []
  );

  useEffect(() => {
    const fetchRootColumn = async () => {
      console.log("fetch root col start");
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${Number(prjId)}`
        );

        const columnData = response.data;
        setColumns(columnData);
        console.log("root col data", columnData);
        setBarsData(columnData);
      } catch (error) {
        console.log(error);
      }
      setFetchBars(false);
      console.log("RUNNING AFTER FETCH BARS");
      setUpdateBarsData(false);
      console.log("ALL BARS ", allBars);
    };
    if (prjId) {
      fetchRootColumn();
    }
  }, [prjId, fetchBars, updateBarsData]);

  // create sub col for columns entity in db
  const createSubCol = async (
    parsedItem: MediaItem,
    containerWidth: number,
    totalDuration: number
  ) => {
    // parsedItem contains most of the data for bars but keys like left and width are added during handleaddbartocol

    // here, containerWidth = mediaContainerWidth hook, totalDuration = totalMediaDuration hook
    const singleTickPxValue = containerWidth / totalDuration; // equal px value for each marker, it changes based upon zoom level
    console.log("mediacontainer width", mediaContainerWidth);
    console.log("total media duration", totalMediaDuration);
    console.log("singletickpxvalue", singleTickPxValue);

    console.log("pareseditem.duration", parsedItem.duration);
    console.log("markerinterval", markerInterval);

    const barId = Math.floor(Math.random() * 1000000) + (Date.now() % 1000000);
    const subColId =
      Math.floor(Math.random() * 1000000) + (Date.now() % 1000000);
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${columns?.id}/sub-columns`,
      {
        sub_col_id: subColId, // subcolid is needed for gaps for connection purpose
        project_id: parsedItem.project_id,
        user_id: parsedItem.user_id,
        parent_id: columns?.id,
        bars: [
          {
            id: barId,
            sub_col_id: subColId, // adding subcolid here to fetch clips(from respective rows) from usespring
            user_id: parsedItem.user_id,
            name: parsedItem.name,
            left_position: 0, // default left position
            width: (parsedItem.duration / markerInterval) * singleTickPxValue,
            duration: parsedItem.duration, // storing duration to use in calcContainerWidth
            clip_duration: parsedItem.duration, // video len after resizing(needed during zoom lvl changes)
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
        gaps: [
          {
            id: Math.floor(Math.random() * 1000000),
            sub_col_id: subColId,
            barId: barId,
            start_gap: 0,
            end_gap: 0,
            width: 0,
          },
        ],
      }
    );
    console.log("create sub col bro:", response.data);
    console.log("before SET FETCH BARS TRUE");
    setFetchBars(true);
    return response;
  };

  const handleMediaDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped_Item = event.dataTransfer.getData("text/plain"); // the data here is passed from leftpane.tsx using .setData
    const parsedItem = JSON.parse(dropped_Item);
    console.log("media dropped parsed item bro", parsedItem);

    // adding the dropped bar to root column, currently each dropped bar will create it's own sub-column
    try {
      const [containerWidth, totalDuration] = await calcContainerWidth(
        parsedItem
      );
      console.log(
        "media contain width, totalmedia duration",
        containerWidth,
        totalDuration
      );
      createSubCol(parsedItem, containerWidth, totalDuration);
    } catch (error) {
      console.error("Error in handling drop:", error);
    }

    // setBarDragging(false);
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
          // sub-columns/:id - patch in backend
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/${dropSubColId}`,
          {
            addBarData: { ...addBarData, left_position: droppedBarNewLeft }, // Also updating the left position while adding bar to subcol
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

  // ****** zoom in out ***********
  // it only changes the containerwidth
  const calcContainerWidth = async (parsedItem?: MediaItem) => {
    console.log("barsdatachangeafter zoom state", barsDataChangeAfterZoom);
    console.log("barsdata[0]", barsData);
    const totalDuration =
      barsData?.sub_columns?.reduce((acc, subCol) => {
        const subColBars = subCol?.bars || [];
        return (
          acc +
          subColBars.reduce((sum, bar) => {
            sum += bar.duration || 0;
            return sum;
          }, 0) // sum intital value = 0
        );
      }, 0) ||
      parsedItem?.duration ||
      0; // if sub_columns is undefined(case: where no sub col present) take duration of dropped media else 0
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
    setMediaContainerWidth(containerWidth);
    return [containerWidth, totalDuration];
  };

  useEffect(() => {
    // calling here for need in calcTicks in timelineruler.tsx
    calcContainerWidth();
  }, [zoomLevel, columns]);

  const zoom_In = async () => {
    const MAX_ZOOM_LEVEL = 0; // Max zoom is 0
    if (zoomLevel !== 0) {
      console.log("zooom in", zoomLevel);
      setZoomLevel((prev) => Math.max(prev - 2, MAX_ZOOM_LEVEL));
      // setFetchBars(true); // it will fetch the barsData which will run the useEffect calcTicks in timelineruler file
    }
  };

  const zoom_Out = async () => {
    const MIN_ZOOM_LEVEL = 10; // High value mean less zoom
    if (zoomLevel >= 0 && zoomLevel < 10) {
      console.log("zooom out", zoomLevel);
      setZoomLevel((prev) => Math.min(prev + 2, MIN_ZOOM_LEVEL));
      // setFetchBars(true);
    }
  };

  // ********** context menu functions ************

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
      console.log("drag over TARGET BAR INDEX", targetIndex);
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
        {barsData?.sub_columns?.length !== 0 &&
          barsData?.sub_columns !== null && (
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
          )}

        <TimelineRuler
          totalDuration={totalMediaDuration}
          zoomLevel={zoomLevel}
          containerWidth={mediaContainerWidth}
          scrollPosition={scrollPosition}
          setBarsDataChangeAfterZoom={setBarsDataChangeAfterZoom}
          barsData={barsData}
          setBarsData={setBarsData}
          videoRef={videoRef}
          setShowPhTime={setShowPhTime}
          api={api}
          setFetchBars={setFetchBars}
          prjId={prjId}
          allBars={allBars}
        />
        <div className={styles.media_parent_div} ref={mediaParentRef}>
          <div
            onClick={() => closeContextMenu()}
            className={styles.closeMenuDiv}
          >
            <div
              className={
                barsData?.sub_columns?.length !== 0
                  ? `${styles.tm_media_container}`
                  : `${styles.empty_tm_media_container}`
              }
              id={"id-1"}
              style={{
                width:
                  mediaContainerWidth !== 0
                    ? `${mediaContainerWidth}px`
                    : "100%",
              }}
            >
              {((barsData && barsData.sub_columns === null) ||
              barsData?.sub_columns?.length === 0
                ? new Array(1).fill(null) //here 1 empty array will be shown when no sub_column will be present(initial state of timeline)
                : barsData?.sub_columns || []
              ).map((item, index) => {
                const isEmpty =
                  barsData?.sub_columns?.length === 0 ||
                  barsData?.sub_columns === null;
                return !isEmpty ? (
                  <div key={index}>
                    <div
                      className={styles.sub_col_div}
                      id={`subcol-${item?.id}`} // id will contain numeric value for each sub_column
                      data-row-id={item?.sub_col_id}
                      ref={(el) => {
                        rowsRef.current[index] = el;
                      }}
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

                      {/* currently this will only work after resize handle are used since barsdata has not been updated */}
                      {gapData &&
                        gapData.sub_columns
                          .filter(
                            (oGap: sub_column) =>
                              oGap.sub_col_id === item.sub_col_id
                          )
                          .map((oGap: sub_column) => {
                            const gapWidth = oGap.gaps.find(
                              (gap) =>
                                gap.barId ===
                                oGap.gaps.find(
                                  (zoomGap) =>
                                    zoomGap?.sub_col_id === gap.sub_col_id
                                )?.barId
                            )?.width;
                            return (
                              <div
                                key={oGap.id}
                                className={styles.gap_box_div}
                                style={{
                                  width: gapWidth, // width according to stored in db and zoom level
                                  left: 0,
                                }}
                              >
                                <div className={styles.gap_box}></div>
                              </div>
                            );
                          })}

                      {/* {item?.bars?.map(
                        (bar: bar, index: number, bars: bar[]) => ( */}
                      {item?.bars?.length > 0 && (
                        // removed map in here check this out
                        <div key={index}>
                          <Clip
                            item={item}
                            isEmpty={isEmpty}
                            barsDataChangeAfterZoom={barsDataChangeAfterZoom}
                            setBarsDataChangeAfterZoom={
                              setBarsDataChangeAfterZoom
                            }
                            barsData={barsData}
                            contextMenu={contextMenu}
                            setContextMenu={setContextMenu}
                            mediaContainerWidth={mediaContainerWidth}
                            setFetchBars={setFetchBars}
                            // bar={item.bar}
                            barIndex={index}
                            bars={item.bars}
                            setBarsData={setBarsData}
                            setUpdateBarsData={setUpdateBarsData}
                            setHoveringOverRow={setHoveringOverRow}
                            rowsRef={rowsRef}
                            addSubColRef={addSubColRef}
                            mediaParentRef={mediaParentRef}
                            prjId={prjId}
                            zoomSprings={springs}
                            zoomApi={api}
                            zoomAllBars={allBars}
                            totalDuration={totalMediaDuration}
                          />
                        </div>
                      )}
                      {/* )
                      )} */}
                    </div>

                    <div className={styles.add_sub_col} ref={addSubColRef}>
                      <div
                        className={`${styles.add_line} ${
                          hoveringOverRow ? "hover:bg-blue_btn" : ""
                        }`}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={styles.empty_parent}
                    key={index}
                    onDragOver={(e) => handleDynamicDragOver(e, item?.id)}
                    onDrop={(e) => handleDynamicDrop(e, item?.id)}
                  >
                    <div className={styles.empty_sub_col}></div>
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
