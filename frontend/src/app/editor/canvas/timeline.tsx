import React, { useState, useRef, useEffect, useMemo } from "react";
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
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [hoveringOverRow, setHoveringOverRow] = useState<boolean>(false);
  const [updateBarsData, setUpdateBarsData] = useState<boolean>(false);
  const [barAfterShift, setBarAfterShift] = useState<boolean>(false);

  // use ref hooks
  const mediaParentRef = useRef<HTMLDivElement | null>(null);
  const phLeftRef = useRef<HTMLDivElement>(null);
  const addSubColRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  const barIdsRef = useRef<number[]>([]);

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
  const allBars = useMemo(() => {
    // using useMemo since allBars becomes stale and doesn't update after barsData changes
    return (
      barsData?.sub_columns?.flatMap((subCol) =>
        [...(subCol.bars || [])].sort((a, b) => a.order - b.order)
      ) || []
    );
  }, [barsData]);

  barIdsRef.current = allBars.map((b: any) => b.id);
  const [springs, api] = useSprings(
    allBars.length || 0,
    (i) => ({
      // barID: allBars[i].id,
      subColId: allBars[i].sub_col_id,
      clipTop: 0,
      clipLP: allBars[i].left_position || 0, // initial lp
      clipWidth: allBars[i].width || 0, // initial width
      zIndex: 1,
      config: { tension: 300, friction: 30 }, // smooth animation
      immediate: true,
    }),
    [barsData]
  );

  useEffect(() => {
    if (barAfterShift && barsDataChangeAfterZoom) {
      const newBars =
        barsDataChangeAfterZoom.sub_columns?.flatMap((sc) => sc.bars) || [];

      newBars.forEach((bar) => {
        const index = barIdsRef.current.findIndex((id) => id === bar.id);
        if (index !== -1) {
          api.start((i) => {
            if (i !== index) return {};
            return {
              clipLP: bar.left_position,
              clipWidth: bar.width,
              immediate: true,
            };
          });
        }
      });

      setBarAfterShift(false);
    }
  }, [barAfterShift, barsDataChangeAfterZoom, api]);

  useEffect(() => {
    const fetchRootColumn = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${Number(prjId)}`
        );

        const columnData = response.data;
        setColumns(columnData);
        console.log("root col data", columnData);
        setBarsData(columnData);
        setBarsDataChangeAfterZoom(columnData); // added here since required after drag,drop for bind functions in clips
      } catch (error) {
        console.log(error);
      }
      setFetchBars(false);
      setBarAfterShift(false);
      setUpdateBarsData(false);
      console.log("ALL BARS ", allBars);
    };
    if (prjId) {
      fetchRootColumn();
    }
  }, [prjId, fetchBars, updateBarsData, barAfterShift]);

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

                      {item?.bars?.length > 0 && (
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
                            setBarAfterShift={setBarAfterShift}
                            barIdsRef={barIdsRef}
                          />
                        </div>
                      )}
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
