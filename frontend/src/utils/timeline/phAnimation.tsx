import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/canvas.module.css";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { throttle } from "lodash";
import { bar, gap } from "@/interfaces/barsProp";
import axios from "axios";

// types / interfaces import
import { BarsProp } from "@/interfaces/barsProp";

interface PhAnimationProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaContainerWidth: number;
  totalMediaDuration: number;
  barsDataChangeAfterZoom: BarsProp | null;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  phLeftRef: React.RefObject<HTMLDivElement>;
  manualPhLeftRef: React.MutableRefObject<number | null>;
  phLeftRefAfterMediaStop: React.MutableRefObject<number | null>;
  lastClipId: React.MutableRefObject<number | null>;
  mediaParentRef: React.MutableRefObject<HTMLDivElement | null>;
  splitClip: boolean;
  setSplitClip: React.Dispatch<React.SetStateAction<boolean>>;
  stopPhAfterZoom: boolean;
  setStopPhAfterZoom: React.Dispatch<React.SetStateAction<boolean>>;
  prjId: string;
  setFetchDataAfterSplit: React.Dispatch<React.SetStateAction<boolean>>;
  isUserScrollingRef: React.MutableRefObject<boolean>;
}
const PhAnimation: React.FC<PhAnimationProps> = ({
  videoRef,
  totalMediaDuration,
  mediaContainerWidth,
  barsDataChangeAfterZoom,
  phLeftRef,
  manualPhLeftRef,
  phLeftRefAfterMediaStop,
  lastClipId,
  setShowPhTime,
  mediaParentRef,
  splitClip,
  setSplitClip,
  stopPhAfterZoom,
  setStopPhAfterZoom,
  prjId,
  setFetchDataAfterSplit,
  isUserScrollingRef,
}) => {
  const subColOrderMap = new Map<number, number>();

  //redux state hooks
  const phPosition = useSelector(
    (state: RootState) => state.phPosition.phPosition
  );

  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  // state hooks
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // useRef
  const animationFrameRef = useRef<number | null>(null);
  const audioAnimationFrameRef = useRef<number | null>(null);
  const previousPhPositionRef = useRef(phPosition);
  const startTimeRef = useRef<number>(0);
  const audioPhStartTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const prevVisibleUnderClipRef = useRef<bar | null>(null);
  const prevActiveClipRef = useRef<bar | null>(null);
  const audioInstancesRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  // Stop playhead when clicked over timelineruler, while ph is running
  useEffect(() => {
    if (phPosition !== previousPhPositionRef.current) {
      stopAnimation();
      return;
    }

    previousPhPositionRef.current = phPosition;
  }, [phPosition]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // for splitting
  const handleGapAfterSplit = async (
    combinedClips: bar[],
    clipIdsToDelete: number[]
  ) => {
    const groupedBySubCol: Record<number, bar[]> = {};

    combinedClips.forEach((clip) => {
      if (!groupedBySubCol[clip.sub_col_id])
        groupedBySubCol[clip.sub_col_id] = [];
      groupedBySubCol[clip.sub_col_id].push(clip);
    });

    const combinedGaps: gap[] = [];

    Object.entries(groupedBySubCol).forEach(([subColIdStr, clips]) => {
      const subColId = Number(subColIdStr);
      const sortedClips = clips.sort(
        (a, b) => a.left_position - b.left_position
      );

      for (let i = 0; i < sortedClips.length; i++) {
        const current = sortedClips[i];

        let startGap: number;
        let endGap: number;

        if (i === 0) {
          startGap = 0;
          endGap = current.left_position;
        } else {
          const prev = sortedClips[i - 1];
          startGap = prev.left_position + prev.width;
          endGap = current.left_position;
        }
        const gapWidth = endGap - startGap;

        combinedGaps.push({
          id: Math.floor(Math.random() * 1e6),
          sub_col_id: subColId,
          barId: current.id,
          start_gap: startGap,
          end_gap: endGap,
          width: gapWidth,
          media_type: current.type,
        });
      }
    });

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/splitGaps/update/${prjId}`,
        { combinedGaps, clipIdsToDelete }
      );
    } catch (error) {
      console.error("Error in gaps after split:", error);
    }
  };

  const handleClipsAfterSplit = async () => {
    const transform = phLeftRef.current?.style.transform;
    const match = transform?.match(/translateX\(([-\d.]+)px\)/);
    const currentX = match ? parseFloat(match[1]) : 0;

    const videoClips = await fetchVideoData();
    const audioClips = await fetchAudioData();

    const splitClipAtX = (clip: bar, currentX: number) => {
      const pxToSec = clip.clip_duration / clip.width;
      const splitOffsetPx = currentX - clip.ruler_start_time;
      const splitOffsetSec = splitOffsetPx * pxToSec;
      const newRulerStartTimeInSec = positionToTime(currentX);

      const firstHalf = {
        ...clip,
        id: Math.floor(Math.random() * 1e6) + (Date.now() % 1e6),
        width: splitOffsetPx,
        clip_duration: splitOffsetSec,
        end_time: clip.start_time + splitOffsetSec,
      };

      const secondHalf = {
        ...clip,
        id: Math.floor(Math.random() * 1e6) + (Date.now() % 1e6),
        left_position: currentX,
        order: firstHalf.order + 1,
        ruler_start_time: currentX,
        ruler_start_time_in_sec: newRulerStartTimeInSec,
        width: clip.width - splitOffsetPx,
        clip_duration: clip.clip_duration - splitOffsetSec,
        start_time: clip.start_time + splitOffsetSec,
      };

      return [firstHalf, secondHalf];
    };

    const newVideoClips: bar[] = [];
    const clipIdsToDelete: number[] = [];
    videoClips.forEach((clip) => {
      if (
        currentX >= clip.ruler_start_time &&
        currentX < clip.ruler_start_time + clip.width
      ) {
        const [first, second] = splitClipAtX(clip, currentX);
        newVideoClips.push(first, second);
        clipIdsToDelete.push(clip.id);
      } else {
        newVideoClips.push(clip);
      }
    });

    const newAudioClips: bar[] = [];
    audioClips.forEach((clip) => {
      if (
        currentX >= clip.ruler_start_time &&
        currentX < clip.ruler_start_time + clip.width
      ) {
        const [first, second] = splitClipAtX(clip, currentX);
        newAudioClips.push(first, second);
        clipIdsToDelete.push(clip.id);
      } else {
        newAudioClips.push(clip);
      }
    });

    const combinedClips = [...newVideoClips, ...newAudioClips];

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/split/update/${prjId}`,
        { combinedClips, clipIdsToDelete }
      );
      setFetchDataAfterSplit(true);
    } catch (error) {
      console.error("Error in splitting clips:", error);
    }
    return [combinedClips, clipIdsToDelete];
  };

  useEffect(() => {
    const handleSplitting = async () => {
      const [combinedClips, clipIdsToDelete] = await handleClipsAfterSplit();
      handleGapAfterSplit(combinedClips as bar[], clipIdsToDelete as number[]);
      setSplitClip(false);
    };
    if (splitClip) handleSplitting();
  }, [splitClip]);

  useEffect(() => {
    const handleStopPhAfterZoom = () => {
      stopAnimation();
      setStopPhAfterZoom(false);
    };
    handleStopPhAfterZoom();
  }, [stopPhAfterZoom]);

  // ********** playhead animation *************

  // position playhead (basically lp of ph)
  const timeToPosition = (time: number) => {
    const pxPerSec = mediaContainerWidth / totalMediaDuration / markerInterval;
    return time * pxPerSec;
  };

  const positionToTime = (px: number) => {
    const pxPerSec = mediaContainerWidth / totalMediaDuration / markerInterval;
    return px / pxPerSec;
  };

  // todo: throttledShowPhTimeUpdate, formatTime are used in playhead, phanimation and timelineRuler file so optimize it
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(2); // sec with upto two decimal places

    const paddedHrs = hrs < 10 ? `0${hrs}` : hrs;
    const paddedMins = mins < 10 ? `0${mins}` : mins;
    const formattedTime = `${paddedHrs}::${paddedMins}::${secs}`;

    return formattedTime;
  };

  const throttledShowPhTimeUpdate = useRef(
    throttle(async (currentTime) => {
      const formattedTime = formatTime(currentTime);
      setShowPhTime(formattedTime);
    }, 500) // Throttle updates every 500ms
  ).current;

  const fetchVideoData = async (): Promise<bar[]> => {
    let order = 0;
    const videoClips =
      barsDataChangeAfterZoom?.sub_columns?.flatMap((subCol) => {
        return subCol.bars
          ?.filter((bar) => bar.type === "video")
          .map((bar) => {
            if (!subColOrderMap.has(bar.sub_col_id)) {
              subColOrderMap.set(bar.sub_col_id, order++);
            }
            return bar;
          });
      }) ?? [];

    return videoClips ?? []; // fallback to empty array if undefined
  };

  const fetchAudioData = async () => {
    let order = 0;
    const audioClips =
      barsDataChangeAfterZoom?.sub_columns?.flatMap((subCol) => {
        return subCol.bars
          ?.filter((bar) => bar.type === "audio")
          .map((bar) => {
            if (!subColOrderMap.has(bar.sub_col_id)) {
              subColOrderMap.set(bar.sub_col_id, order++);
            }
            return bar;
          });
      }) ?? [];

    return audioClips;
  };

  // Update the scrollleft of media_parent_div when playhead moves out of view
  const checkScrollIntoView = () => {
    if (isUserScrollingRef.current) return; // stop autoscroll when manual scroll working
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
  };

  const runAudioClips = async (newPosition: number) => {
    const audioClips = await fetchAudioData();

    const activeAudioClips = audioClips
      .filter(
        (clip) =>
          newPosition >= clip.ruler_start_time &&
          newPosition < clip.ruler_start_time + clip.width
      )
      .sort(
        (a, b) =>
          (subColOrderMap.get(a.sub_col_id) ?? Infinity) -
          (subColOrderMap.get(b.sub_col_id) ?? Infinity)
      );

    const activeClipIds = new Set(activeAudioClips.map((clip) => clip.id));
    const currentInstances = audioInstancesRef.current;

    // Stop clips that are no longer active
    for (const [id, audio] of currentInstances.entries()) {
      if (!activeClipIds.has(id)) {
        audio.pause();
        currentInstances.delete(id);
      }
    }

    // Start new active clips
    for (const clip of activeAudioClips) {
      if (!currentInstances.has(clip.id)) {
        const audio = new Audio(clip.url);
        const clipStartOffsetSec =
          (newPosition - clip.ruler_start_time) / timeToPosition(1); // convert px to sec
        audio.currentTime = clip.start_time + clipStartOffsetSec;
        audio.volume = clip.volume ?? 1; // default volume 1
        audio.play();
        currentInstances.set(clip.id, audio);
      }
    }
  };

  const updatePlayhead = async (now: number) => {
    if (
      audioPhStartTimeRef.current !== null &&
      audioAnimationFrameRef.current !== null
    ) {
      const elapsed = (now - audioPhStartTimeRef.current) / 1000; // seconds
      const basePosition = manualPhLeftRef.current ?? 0;
      const newPosition = basePosition + timeToPosition(elapsed); // convert seconds to px

      const showTime = positionToTime(newPosition); // for showing playhead time
      throttledShowPhTimeUpdate(showTime);

      await runAudioClips(newPosition);

      if (phLeftRef.current) {
        phLeftRef.current.style.transform = `translateX(${newPosition}px)`;
        phLeftRefAfterMediaStop.current = newPosition; // for keeping ph position where it was left when stopanimation ran
      }

      checkScrollIntoView();

      audioAnimationFrameRef.current = requestAnimationFrame((nextNow) =>
        updatePlayhead(nextNow)
      );
    }
  };

  const startManualTimer = () => {
    if (!isPlaying) setIsPlaying(true);
    audioPhStartTimeRef.current = performance.now();
    audioAnimationFrameRef.current = requestAnimationFrame((now) =>
      updatePlayhead(now)
    );
  };

  const stopManualTimer = () => {
    if (audioAnimationFrameRef.current)
      cancelAnimationFrame(audioAnimationFrameRef.current);

    // Stop all currently playing audio
    audioInstancesRef.current.forEach((audio) => {
      audio.pause();
    });
    audioInstancesRef.current.clear();

    audioAnimationFrameRef.current = null;
    audioPhStartTimeRef.current = 0;
    setIsPlaying(false);
  };

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current) {
        videoRef.current.pause(); //pause video
        videoRef.current.src = "";
        videoRef.current.load();
      }
    }
    animationFrameRef.current = null;
    setIsPlaying(false);
    manualPhLeftRef.current = phLeftRefAfterMediaStop.current;
    stopManualTimer();
  };

  const chooseClip = async (now: number) => {
    if (animationFrameRef.current !== null) {
      const elapsed = (now - startTimeRef.current) / 1000; // seconds
      const basePosition = manualPhLeftRef.current ?? 0;
      const newPosition = basePosition + timeToPosition(elapsed); // convert seconds to px
      const showTime = positionToTime(newPosition);
      throttledShowPhTimeUpdate(showTime);

      await runAudioClips(newPosition);
      const videoClips = await fetchVideoData();

      const activeClip = videoClips
        .filter(
          (clip) =>
            newPosition >= clip.ruler_start_time &&
            newPosition < clip.ruler_start_time + clip.width
        )
        .sort(
          (a, b) =>
            (subColOrderMap.get(a.sub_col_id) ?? Infinity) -
            (subColOrderMap.get(b.sub_col_id) ?? Infinity)
        )[0];

      if (activeClip && phLeftRef.current && videoRef.current) {
        //  Get clips overlapping with active clip
        const overlappingClips = videoClips.filter((clip) => {
          return (
            clip.ruler_start_time <
              activeClip.ruler_start_time + activeClip.width &&
            clip.ruler_start_time + clip.width > activeClip.ruler_start_time &&
            clip.id !== activeClip.id // exclude current active clip
          );
        });

        //  Keep only those *under* the current active clip in layer
        const underClips = overlappingClips.filter((clip) => {
          return (
            (subColOrderMap.get(clip.sub_col_id) ?? Infinity) >
            (subColOrderMap.get(activeClip.sub_col_id) ?? -Infinity)
          );
        });

        // Sort underclips from topmost to bottommost
        const sortedUnderClips = underClips.sort(
          (a, b) =>
            (subColOrderMap.get(a.sub_col_id) ?? Infinity) -
            (subColOrderMap.get(b.sub_col_id) ?? Infinity)
        );

        //  Find the topmost visible underclip
        let visibleUnderClip: bar | null = null;

        for (let i = 0; i < sortedUnderClips.length; i++) {
          const current = sortedUnderClips[i];
          const clipAboveCurrent = sortedUnderClips
            .slice(0, i) // clips above the current one
            .some(
              (upper) =>
                upper.ruler_start_time <
                  current.ruler_start_time + current.width &&
                upper.ruler_start_time + upper.width > current.ruler_start_time
            );
          if (!clipAboveCurrent) {
            visibleUnderClip = current;
            break;
          }
        }

        // let effectiveStartTime = activeClip.start_time;
        const offsetPx = newPosition - activeClip.ruler_start_time;
        const offsetTime = positionToTime(offsetPx);

        let effectiveStartTime = activeClip.start_time + offsetTime;
        if (prevVisibleUnderClipRef.current && prevActiveClipRef.current) {
          if (activeClip.id === prevVisibleUnderClipRef.current.id) {
            const topClipEnd =
              prevActiveClipRef.current.ruler_start_time +
              prevActiveClipRef.current.width;
            const underClipOriginalStart =
              topClipEnd - prevVisibleUnderClipRef.current.ruler_start_time;

            const secOffset = positionToTime(underClipOriginalStart);
            const newStartTime =
              prevVisibleUnderClipRef.current.start_time + secOffset;
            effectiveStartTime = newStartTime;
          }
        }

        if (
          activeClip.id !== lastClipId.current ||
          (videoRef.current?.paused && videoRef.current?.src !== activeClip.url)
        ) {
          lastClipId.current = activeClip.id;

          const clipSrc = activeClip.url;
          videoRef.current.src = clipSrc;
          videoRef.current.load();

          videoRef.current.onloadedmetadata = async () => {
            try {
              videoRef.current?.pause();
              if (videoRef.current) {
                if (activeClip) {
                  videoRef.current.currentTime = effectiveStartTime;
                  videoRef.current.volume = activeClip.volume ?? 1; // default volume 1
                  prevVisibleUnderClipRef.current = visibleUnderClip;
                  prevActiveClipRef.current = activeClip;
                }
              }
              await videoRef.current?.play();
            } catch (err) {
              if (err instanceof DOMException && err.name !== "AbortError") {
                console.error("Video play error:", err);
              }
              // if (videoRef.current)
              //   videoRef.current.onerror = () => {
              //     const error = videoRef.current?.error;
              //     console.error("Video load error:", error);
              //   };
            }
          };
        }

        phLeftRef.current.style.transform = `translateX(${newPosition}px)`;
      } else {
        // either gaps or audio clip present
        if (videoRef.current) {
          videoRef.current.src = "";
        }
        if (phLeftRef.current) {
          phLeftRef.current.style.transform = `translateX(${newPosition}px)`;
        }
      }

      phLeftRefAfterMediaStop.current = newPosition; // for keeping ph position where it was left when stopanimation ran
      checkScrollIntoView();
    }
  };

  const syncPlayhead = (now: number) => {
    if (isPlayingRef.current && animationFrameRef.current !== null) {
      chooseClip(now);
      animationFrameRef.current = requestAnimationFrame((nextNow) =>
        syncPlayhead(nextNow)
      );
    }
  };

  const prepareAudioClips = async () => {
    const videoClips = await fetchVideoData();

    if (videoClips.length === 0) {
      // only run startmanual timer when there is no video clips
      startManualTimer();
    }
    return videoClips;
  };

  const startAnimation = async () => {
    const videoClips = await prepareAudioClips();
    if (videoClips.length !== 0) {
      if (isPlaying === false) {
        startTimeRef.current = performance.now();
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame((now) =>
          syncPlayhead(now)
        );
      }
    }
  };

  return (
    <div className={styles.playback_btns}>
      <div onClick={isPlaying ? stopAnimation : startAnimation}>
        <Image
          src={isPlaying ? "/pause.png" : "/play.png"}
          width={25}
          height={25}
          alt={isPlaying ? "pause" : "play"}
          priority={true}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default PhAnimation;
