import React, { useState, useRef, useEffect, useCallback, act } from "react";
import styles from "@/styles/canvas.module.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setPhPosition } from "@/redux/phPosition";
import { setCurrentClip } from "@/redux/currentClip";
import Image from "next/image";
import { mapKeys, throttle } from "lodash";
import { bar, gap } from "@/interfaces/barsProp";

// types / interfaces import
import { BarsProp } from "@/interfaces/barsProp";

interface PhAnimationProps {
  setPosition: React.Dispatch<React.SetStateAction<number>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaContainerWidth: number;
  totalMediaDuration: number;
  barsDataChangeAfterZoom: BarsProp | null;
  position: number;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  phLeftRef: React.RefObject<HTMLDivElement>;
}
const PhAnimation: React.FC<PhAnimationProps> = ({
  setPosition,
  videoRef,
  totalMediaDuration,
  mediaContainerWidth,
  barsDataChangeAfterZoom,
  // position,
  setShowPhTime,
  phLeftRef,
}) => {
  const dispatch = useDispatch();

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
  const previousPhPositionRef = useRef(phPosition);
  const startTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const lastClipId = useRef<number | null>(null);
  const prevVisibleUnderClipRef = useRef<bar | null>(null);
  const prevActiveClipRef = useRef<bar | null>(null);

  // Stop playhead when clicked over timelineruler, while ph is running
  useEffect(() => {
    if (phPosition !== previousPhPositionRef.current) {
      stopAnimation();
      return;
    }

    previousPhPositionRef.current = phPosition;
  }, [phPosition]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        console.log("animation frame ref", animationFrameRef.current);
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
    // console.log("subColOrderMap:", Array.from(subColOrderMap.entries()));

    return videoClips ?? []; // fallback to empty array if undefined
  };

  const fetchGapsData = async () => {
    let order = 0;
    const gaps =
      barsDataChangeAfterZoom?.sub_columns?.flatMap((subCol) => {
        return subCol.gaps.map((gap) => {
          if (!subColOrderMap.has(gap.sub_col_id)) {
            subColOrderMap.set(gap.sub_col_id, order++);
          }
          return gap;
        });
      }) ?? [];
    return gaps;
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

    return [audioClips];
  };

  const updatePlayhead = async (now: number, leastGap: gap) => {
    console.log("update play runing");
    if (startTimeRef.current !== null && animationFrameRef.current !== null) {
      // console.log("update playhead ran");
      const elapsed = (now - startTimeRef.current) / 1000; // seconds
      console.log("now - starttimeref", now, startTimeRef.current);
      const newPosition = timeToPosition(elapsed); // convert seconds to px
      // setPosition(newPosition);
      // dispatch(setPhPosition(null));

      const gaps = await fetchGapsData();
      const videoGaps = gaps.filter((gap) => gap.media_type === "video");
      videoGaps.sort((a, b) => a.end_gap - b.end_gap);

      const videoClips = await fetchVideoData();
      const phMovingOverVid = videoClips.find(
        (vid) =>
          newPosition >= vid.ruler_start_time &&
          newPosition <= vid.ruler_start_time + vid.width
      );

      // console.log("video gaps checko", videoGaps);

      const phMovingInGap = videoGaps.find(
        (gap) => newPosition >= gap.start_gap && newPosition <= gap.end_gap
      );

      //start video once playhead reaches the clip
      // if (Math.floor(newPosition) === Math.floor(leastGap.end_gap)) {
      //   console.log("new pos, end gap", newPosition, leastGap.end_gap);
      //   // stopManualTimer();
      //   startAnimation();
      //   // return;
      // }
      console.log("new position", newPosition);
      console.log("ph moving in gap", phMovingInGap);
      if (phMovingInGap) {
        if (phLeftRef.current) {
          phLeftRef.current.style.transform = `translateX(${newPosition}px)`;
          // console.log("new position after stop", newPosition);
        }
      } else {
        console.log("ran start animation from up");
        startAnimation();
        return;
      }

      animationFrameRef.current = requestAnimationFrame((nextNow) =>
        updatePlayhead(nextNow, leastGap)
      );
    }
  };

  const startManualTimer = (leastGap: gap) => {
    if (!isPlaying) setIsPlaying(true);
    console.log("start manual timer ran");
    startTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame((now) =>
      updatePlayhead(now, leastGap)
    );
  };

  const stopManualTimer = () => {
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    console.log("stop manual time ran");
    animationFrameRef.current = null;
    startTimeRef.current = 0;
    setIsPlaying(false);
  };

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      console.log("stop animation ran ", animationFrameRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current) {
        videoRef.current.pause(); //pause video
      }
    }
    animationFrameRef.current = null;
    setIsPlaying(false);
    stopManualTimer();
  };

  const chooseClip = async (now: number) => {
    if (animationFrameRef.current !== null) {
      const elapsed = (now - startTimeRef.current) / 1000; // seconds
      const newPosition = timeToPosition(elapsed); // convert seconds to px

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

        let effectiveStartTime = activeClip.start_time;

        if (prevVisibleUnderClipRef.current && prevActiveClipRef.current) {
          if (activeClip.id === prevVisibleUnderClipRef.current.id) {
            // console.log("visible und er clip", visibleUnderClip);
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

        if (activeClip.id !== lastClipId.current) {
          lastClipId.current = activeClip.id;

          const clipSrc = `${activeClip.url}?id=${activeClip.id}`; // adding clip id to each url to run onloadmetadata even when same url
          // Only assign .src if the clip is actually new
          if (videoRef.current.src !== activeClip.url) {
            videoRef.current.src = clipSrc;
            videoRef.current.load();
          }

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.pause();
            if (videoRef.current) {
              if (activeClip) {
                videoRef.current.currentTime = effectiveStartTime;
                prevVisibleUnderClipRef.current = visibleUnderClip;
                prevActiveClipRef.current = activeClip;
              }
            }
            videoRef.current?.play();
          };
        }

        phLeftRef.current.style.transform = `translateX(${newPosition}px)`;
      } else {
        // either gaps or audio clip present
        // console.log("no active clip", activeClip);
        if (videoRef.current) {
          videoRef.current.src = "";
        }
        if (phLeftRef.current) {
          phLeftRef.current.style.transform = `translateX(${newPosition}px)`;
        }
      }
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

  const prepareVideoClips = async () => {
    console.log("prep video clip");
    const videoClips = await fetchVideoData();

    const currentTime = videoRef.current?.currentTime ?? 0;

    const transform = phLeftRef.current?.style.transform; // e.g., "translateX(120px)"
    const match = transform?.match(/translateX\(([-\d.]+)px\)/);
    const phTime = match ? Math.ceil(parseFloat(match[1])) : 0;

    console.log("ct , ph time", currentTime, phTime);
    if (currentTime === null) return;
    let activeClip: bar | gap;

    const gaps = await fetchGapsData();
    const videoGaps = gaps.filter((gap) => gap.media_type === "video");
    console.log("video gaps", videoGaps);
    console.log("video clips", videoClips);

    const leastGap = videoGaps.reduce((min, gap) =>
      gap.end_gap < min.end_gap ? gap : min
    );
    console.log("lest gap", leastGap);

    activeClip = videoClips
      .filter(
        (clip) =>
          phTime >= clip.ruler_start_time &&
          phTime < clip.ruler_start_time + clip.width
      )
      .sort(
        (a, b) =>
          (subColOrderMap.get(a.sub_col_id) ?? Infinity) -
          (subColOrderMap.get(b.sub_col_id) ?? Infinity)
      )[0]; // topmost (leftmost)

    console.log("acitve clip", activeClip);
    if (activeClip === undefined) {
      console.log("undefined starat manual time running now");
      startManualTimer(leastGap);
    }

    // if (activeClip === undefined) {
    //   const [audioClips] = await fetchAudioData();

    //   const audioGaps = gaps.filter((gap) => gap.media_type === "audio");
    //   console.log("audio gaps", audioGaps);
    //   console.log("audio clips", audioClips);
    // }

    return { activeClip, leastGap };
  };

  const startAnimation = async () => {
    console.log("start animation");

    // const result = await prepareVideoClips();
    // if (!result) return;
    // const { activeClip, leastGap } = result;
    // startManualTimer(leastGap);

    // if (activeClip) {
    // dispatch(setCurrentClip(activeClip));
    // startManualTimer(leastGap);
    if (isPlaying === false) {
      startTimeRef.current = performance.now();
      // console.log("whats active clip", activeClip);
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame((now) =>
        syncPlayhead(now)
      );
    }
    // }
  };

  return (
    <div className={styles.playback_btns}>
      <div onClick={isPlaying ? stopAnimation : startAnimation}>
        {/* <div onClick={isPlaying ? stopManualTimer : startManualTimer}> */}
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
