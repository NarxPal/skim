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
import { BarsProp, gap, bar, sub_column } from "@/interfaces/barsProp";
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
  id: number;
  sub_col_id: number;
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
  showPhTime: string;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  phLeftRef: React.RefObject<HTMLDivElement>;
  manualPhLeftRef: React.MutableRefObject<number | null>;
  phLeftRefAfterMediaStop: React.MutableRefObject<number | null>;
  setBarForVolume: React.Dispatch<React.SetStateAction<bar | null>>;
  lastClipId: React.MutableRefObject<number | null>;
  setOpenRightPane: React.Dispatch<React.SetStateAction<boolean>>;
  mediaParentRef: React.MutableRefObject<HTMLDivElement | null>;
  setSplitClip: React.Dispatch<React.SetStateAction<boolean>>;
  setStopPhAfterZoom: React.Dispatch<React.SetStateAction<boolean>>;
  fetchDataAfterSplit: boolean;
  setFetchDataAfterSplit: React.Dispatch<React.SetStateAction<boolean>>;
  fetchDataAfterVolChange: boolean;
  setFetchDataAfterVolChange: React.Dispatch<React.SetStateAction<boolean>>;
  isUserScrollingRef: React.MutableRefObject<boolean>;
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
  showPhTime,
  setShowPhTime,
  videoRef,
  phLeftRef,
  manualPhLeftRef,
  phLeftRefAfterMediaStop,
  setBarForVolume,
  lastClipId,
  setOpenRightPane,
  mediaParentRef,
  setSplitClip,
  setStopPhAfterZoom,
  fetchDataAfterSplit,
  setFetchDataAfterSplit,
  fetchDataAfterVolChange,
  setFetchDataAfterVolChange,
  isUserScrollingRef,
}) => {
  // usestate hooks
  const [columns, setColumns] = useState<ColumnsProps | undefined>(undefined); // column and barsdata are having same data
  const [barsData, setBarsData] = useState<BarsProp | null>(null);
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
  const [hoveringOverRow, setHoveringOverRow] = useState<boolean>(false);
  const [updateBarsData, setUpdateBarsData] = useState<boolean>(false);
  const [barAfterShift, setBarAfterShift] = useState<boolean>(false);

  // use ref hooks
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const barIdsRef = useRef<number[]>([]);
  const playheadRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement | null>(null);

  // redux hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  // // needed for scrolling ruler when scrolled using thumb
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const handleScroll = () => {
    const media = mediaParentRef.current;
    if (!media) return;

    // for auto scroll during ph movement
    isUserScrollingRef.current = true;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 200);
  };

  // Sync ruler & playhead directly on scroll
  useEffect(() => {
    const media = mediaParentRef.current;
    const ruler = rulerRef.current;
    const playhead = playheadRef.current;

    if (!media || !ruler || !playhead) return;

    const syncScroll = () => {
      const scrollLeft = media.scrollLeft;
      if (ruler) ruler.scrollLeft = scrollLeft;

      // using animation frame since playhead div appear after clips are dropped
      requestAnimationFrame(() => {
        if (playheadRef.current) {
          playheadRef.current.scrollLeft = scrollLeft;
        } else {
          console.warn("playheadRef not ready during syncScroll");
        }
      });
    };

    media.addEventListener("scroll", handleScroll);
    media.addEventListener("scroll", syncScroll);

    return () => {
      media.removeEventListener("scroll", handleScroll);
      media.removeEventListener("scroll", syncScroll);
    };
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

  barIdsRef.current = allBars.map((b: bar) => b.id);
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
      setFetchDataAfterSplit(false);
      setFetchDataAfterVolChange(false);
      console.log("ALL BARS ", allBars);
    };
    if (prjId) {
      fetchRootColumn();
    }
  }, [
    prjId,
    fetchBars,
    updateBarsData,
    barAfterShift,
    fetchDataAfterSplit,
    fetchDataAfterVolChange,
  ]);

  const buildSubColumnPayload = (
    parsedItem: MediaItem,
    columns: ColumnsProps | undefined,
    singleTickPxValue: number,
    markerInterval: number
  ) => {
    const barId = Math.floor(Math.random() * 1e6) + (Date.now() % 1e6);
    const subColId = Math.floor(Math.random() * 1e6) + (Date.now() % 1e6);
    const duration = parsedItem.duration;

    const payload: sub_column = {
      id: null, // it won't be null, adding id in backend code
      sub_col_id: subColId,
      project_id: parsedItem.project_id,
      user_id: parsedItem.user_id,
      parent_id: columns?.id,
      media_type: parsedItem.type,
      bars: [
        {
          id: barId,
          sub_col_id: subColId,
          user_id: parsedItem.user_id,
          name: parsedItem.name,
          left_position: 0,
          width: (duration / markerInterval) * singleTickPxValue,
          duration,
          clip_duration: duration,
          project_id: parsedItem.project_id,
          type: parsedItem.type,
          thumbnail_url: parsedItem.thumbnail_url,
          filepath: parsedItem.filepath,
          order: 0,
          url: parsedItem.url,
          start_time: 0,
          end_time: duration,
          ruler_start_time: 0,
          ruler_start_time_in_sec: 0,
          volume: 1.0,
        },
      ],
      gaps: [
        {
          id: Math.floor(Math.random() * 1e6),
          sub_col_id: subColId,
          barId: barId,
          start_gap: 0,
          end_gap: 0,
          width: 0,
          media_type: parsedItem.type,
        },
      ],
    };
    return payload;
  };

  // create sub col for columns entity in db
  const createSubCol = async (
    parsedItem: MediaItem,
    containerWidth: number,
    totalDuration: number
  ) => {
    // here, containerWidth = mediaContainerWidth hook, totalDuration = totalMediaDuration hook
    const singleTickPxValue = containerWidth / totalDuration; // equal px value for each marker, it changes based upon zoom level

    // payload could be for both audio and video media
    const payload = buildSubColumnPayload(
      parsedItem,
      columns,
      singleTickPxValue,
      markerInterval
    );

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${columns?.id}/sub-columns`,
      payload
    );

    setFetchBars(true);
    return response;
  };

  const handleMediaDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped_Item = event.dataTransfer.getData("text/plain");
    if (!dropped_Item) return;

    let parsedItem;
    try {
      parsedItem = JSON.parse(dropped_Item);
      console.log("media dropped parsed item bro", parsedItem);
    } catch (error) {
      console.error("Invalid dropped item:", error);
      return; // prevent further execution
    }

    try {
      const [containerWidth, totalDuration] = await calcContainerWidth(
        parsedItem
      );
      createSubCol(parsedItem, containerWidth, totalDuration);
    } catch (error) {
      console.error("Error in handling drop:", error);
    }
  };

  const addNewSubCol = async () => {
    try {
      const subColId =
        Math.floor(Math.random() * 1000000) + (Date.now() % 1000000);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${columns?.id}/sub-columns`,
        {
          sub_col_id: subColId,
          project_id: columns?.project_id,
          user_id: columns?.user_id,
          parent_id: columns?.id,
          media_type: "",
          // bars will be empty here since this new subcol is for creating subcol having no bars
          bars: [],
          gaps: [],
        }
      );
      console.log("sub col created for empty bars :", response.data);
      setFetchBars(true); // Fetch and show all the sub_col in timeline
      return response;
    } catch (error) {
      console.log("error creating empty subcol", error);
    }
  };

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

    const factor = 10;
    const minPixelsPerSecond = 80;
    const maxPixelsPerSecond = 300;

    const pixelsPerSecond = Math.min(
      maxPixelsPerSecond,
      Math.max(minPixelsPerSecond, zoomLevel * factor)
    );

    const containerWidth = totalDuration * pixelsPerSecond;

    // let containerWidth = 0;

    // if (zoomLevel >= 10) {
    //   containerWidth = totalDuration * 100; // making 100px per sec for zoom level 10
    // } else if (zoomLevel >= 8) {
    //   containerWidth = totalDuration * 80;
    // } else if (zoomLevel >= 5) {
    //   containerWidth = totalDuration * 80;
    // } else if (zoomLevel >= 2) {
    //   containerWidth = totalDuration * 80;
    // } else {
    //   containerWidth = totalDuration * 80;
    // }

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
      setStopPhAfterZoom(true);
    }
  };

  const zoom_Out = async () => {
    const MIN_ZOOM_LEVEL = 10; // High value mean less zoom
    if (zoomLevel >= 0 && zoomLevel < 10) {
      console.log("zooom out", zoomLevel);
      setZoomLevel((prev) => Math.min(prev + 2, MIN_ZOOM_LEVEL));
      // setFetchBars(true);
      setStopPhAfterZoom(true);
    }
  };

  // ********** context menu functions ************

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, id: null });
  };

  // *********** drag and drop functions ***************
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const shiftGapsAfterGapDelete = async (data: BarsProp, gap: gap) => {
    try {
      const allUpdatedGaps = [];

      for (const subcol of data.sub_columns || []) {
        const changeBarOfDelGap = subcol.bars?.find((b) => b.id === gap.barId);
        if (!changeBarOfDelGap) continue;

        const barsPresentAfterBarGapDel = subcol.bars
          .filter((bar) => bar.left_position > changeBarOfDelGap.left_position)
          .sort((a, b) => a.left_position - b.left_position);

        // get id of all bars present after the deleted gap of bar(changeBarOfDelGap)
        const barIds = barsPresentAfterBarGapDel.map((bar) => bar.id);
        // find all gaps related to bars present after bar gap del
        const relatedGaps = subcol.gaps.filter((gap) =>
          barIds.includes(gap.barId)
        );

        for (const gap of relatedGaps) {
          const bar = barsPresentAfterBarGapDel.find((b) => b.id === gap.barId);
          if (!bar) continue;

          const prevBar = subcol.bars
            .filter((b) => b.left_position < bar.left_position)
            .sort((a, b) => b.left_position - a.left_position)[0];

          const start_gap = prevBar ? prevBar.left_position + prevBar.width : 0;
          const end_gap = bar.left_position;
          const width = end_gap - start_gap;

          allUpdatedGaps.push({
            ...gap,
            start_gap,
            end_gap,
            width,
          });
        }
      }
      if (allUpdatedGaps.length > 0) {
        const updatedGap = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/g/update/batchUpdate/${data.project_id}`,
          { updatedGaps: allUpdatedGaps }
        );
        console.log("updated gap checkoo for shift gaps", updatedGap.data);
        setBarsData(updatedGap.data);
        setBarsDataChangeAfterZoom(updatedGap.data);
        setBarAfterShift(true);
      }
    } catch (error) {
      console.error("Error in shiftGapsAfterGapDelete:", error);
    }
  };

  const shiftBarsAfterGapDelete = async (data: BarsProp, gap: gap) => {
    try {
      console.log("shift bar gap del ran");
      data.sub_columns?.map(async (subCol) => {
        const changeBarOfDelGap = subCol.bars?.find(
          (bar) => bar.id === gap.barId
        );
        if (!changeBarOfDelGap) return;

        const singleTickPxValue = mediaContainerWidth / totalMediaDuration;
        const pxPerSecond = singleTickPxValue / markerInterval;

        changeBarOfDelGap.left_position = gap.start_gap;
        changeBarOfDelGap.ruler_start_time = gap.start_gap;
        changeBarOfDelGap.ruler_start_time_in_sec = gap.start_gap / pxPerSecond;

        const barsPresentAfterChangeBar = subCol.bars
          .filter((bar) => bar.left_position > changeBarOfDelGap.left_position)
          .sort((a, b) => a.left_position - b.left_position);

        const barsPresentBeforeChangedBar = subCol.bars.filter(
          (bar) => bar.left_position < changeBarOfDelGap.left_position
        );

        if (!barsPresentAfterChangeBar) return;

        for (let i = 0; i < barsPresentAfterChangeBar.length; i++) {
          const curr = barsPresentAfterChangeBar[i];
          curr.left_position -= gap.width;
          curr.ruler_start_time = curr.left_position;
          curr.ruler_start_time_in_sec = curr.left_position / pxPerSecond;
        }

        const updatedBars = [
          ...barsPresentBeforeChangedBar.map((bar) => ({ ...bar })),
          { ...changeBarOfDelGap },
          ...barsPresentAfterChangeBar.map((bar) => ({ ...bar })),
        ];

        const updatedData = await axios.patch(
          // sub-columns/:id - patch in backend
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/updateBar/${gap.sub_col_id}`,
          {
            addBarData: { ...updatedBars },
          }
        );
        console.log("updated data.data shift bar gap checko", updatedData.data);
        const getUpdatedData = updatedData.data;
        shiftGapsAfterGapDelete(getUpdatedData, gap);
      });
    } catch (error) {
      console.error("Error in shiftBarsAfterGapDelete:", error);
    }
  };

  const handleDelGap = async (gap: gap) => {
    try {
      const allGaps = barsDataChangeAfterZoom?.sub_columns?.flatMap(
        (subcol) => subcol.gaps || []
      );
      if (!allGaps) return;
      const targetGap = allGaps.find((g) => g.barId === gap.barId);

      if (!targetGap) return;
      const startGap = targetGap?.start_gap;
      const delGap = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/gaps/update/${prjId}/${gap.id}`,
        { ...targetGap, start_gap: startGap, end_gap: startGap, width: 0 }
      );
      console.log("del gap checko ran", delGap.data);
      setBarsData(delGap.data);
      setBarsDataChangeAfterZoom(delGap.data);
      setBarAfterShift(true);
      shiftBarsAfterGapDelete(delGap.data, gap);
    } catch (error) {
      console.log("error in handleDelGap", error);
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
            <div className={styles.tm_icon} onClick={() => setSplitClip(true)}>
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
              phLeftRef={phLeftRef}
              mediaContainerWidth={mediaContainerWidth}
              videoRef={videoRef}
              totalDuration={totalMediaDuration}
              manualPhLeftRef={manualPhLeftRef}
              phLeftRefAfterMediaStop={phLeftRefAfterMediaStop}
              setShowPhTime={setShowPhTime}
              playheadRef={playheadRef}
            />
          )}

        <TimelineRuler
          totalDuration={totalMediaDuration}
          zoomLevel={zoomLevel}
          containerWidth={mediaContainerWidth}
          barsData={barsData}
          videoRef={videoRef}
          api={api}
          setFetchBars={setFetchBars}
          prjId={prjId}
          allBars={allBars}
          phLeftRef={phLeftRef}
          manualPhLeftRef={manualPhLeftRef}
          phLeftRefAfterMediaStop={phLeftRefAfterMediaStop}
          lastClipId={lastClipId}
          setShowPhTime={setShowPhTime}
          rulerRef={rulerRef}
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
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => handleMediaDrop(e)}
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
                  <div key={index} className={styles.clip_row}>
                    <div
                      className={`${
                        item?.media_type === "audio"
                          ? styles.audio_sub_col_div
                          : styles.sub_col_div
                      }`}
                      id={`subcol-${item?.id}`} // id will contain numeric value for each sub_column
                      data-row-id={item?.sub_col_id}
                      ref={(el) => {
                        rowsRef.current[index] = el;
                      }}
                    >
                      {item?.gaps?.length > 0 &&
                        item.gaps.map((gap: gap) => {
                          const gapWidth = gap.width;
                          const startGap = gap.start_gap;
                          return (
                            <div
                              key={gap.id}
                              className={`${
                                gap.media_type === "audio"
                                  ? styles.audio_gap_box_div
                                  : styles.gap_box_div
                              }`}
                              style={{
                                width: gapWidth,
                                left: startGap,
                              }}
                            >
                              <div className={styles.gap_box}>
                                {gapWidth >= 50 && (
                                  <div
                                    className={`${
                                      gap.media_type === "audio"
                                        ? styles.audio_gap_del_icon
                                        : styles.gap_del_icon
                                    }`}
                                    onClick={() => handleDelGap(gap)}
                                  >
                                    <Image
                                      alt="del"
                                      src="/delete.png"
                                      width={15}
                                      height={15}
                                      priority={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {item?.bars?.length > 0 && (
                        <div
                          className={styles.cm_clips_wrapper}
                          key={index}
                          id="cm-clips-wrapper"
                        >
                          <Clip
                            item={item}
                            barsDataChangeAfterZoom={barsDataChangeAfterZoom}
                            setBarsDataChangeAfterZoom={
                              setBarsDataChangeAfterZoom
                            }
                            barsData={barsData}
                            contextMenu={contextMenu}
                            setContextMenu={setContextMenu}
                            mediaContainerWidth={mediaContainerWidth}
                            setFetchBars={setFetchBars}
                            barIndex={index}
                            setBarsData={setBarsData}
                            setUpdateBarsData={setUpdateBarsData}
                            setHoveringOverRow={setHoveringOverRow}
                            rowsRef={rowsRef}
                            prjId={prjId}
                            zoomSprings={springs}
                            zoomApi={api}
                            totalDuration={totalMediaDuration}
                            setBarAfterShift={setBarAfterShift}
                            barIdsRef={barIdsRef}
                            setBarForVolume={setBarForVolume}
                            setOpenRightPane={setOpenRightPane}
                          />
                        </div>
                      )}
                    </div>

                    <div className={styles.add_sub_col}>
                      <div
                        className={`${styles.add_line} ${
                          hoveringOverRow ? "hover:bg-blue_btn" : ""
                        }`}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.empty_parent} key={index}>
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
