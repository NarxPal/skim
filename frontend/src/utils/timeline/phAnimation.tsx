import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/canvas.module.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setPhPosition } from "@/redux/phPosition";
import { setCurrentClip } from "@/redux/currentClip";
import Image from "next/image";
import { throttle } from "lodash";

// types / interfaces import
import { BarsProp } from "@/interfaces/barsProp";

type Clip = {
  leftPos: number;
  startTime: number;
  endTime: number;
  videoUrl: string;
};

interface PhAnimationProps {
  setPosition: React.Dispatch<React.SetStateAction<number>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaContainerWidth: number;
  totalMediaDuration: number;
  barsDataChangeAfterZoom: BarsProp | null;
  position: number;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  // isPlaying: boolean;
  // setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}
const PhAnimation: React.FC<PhAnimationProps> = ({
  setPosition,
  videoRef,
  totalMediaDuration,
  mediaContainerWidth,
  barsDataChangeAfterZoom,
  // position,
  setShowPhTime,
  // isPlaying,
  // setIsPlaying,
  // canvasRef,
}) => {
  const dispatch = useDispatch();

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

  // ********** playhead animation *************

  // position playhead (basically lp of ph)
  const timeToPosition = (currentTime: number) => {
    // console.log((currentTime / totalMediaDuration) * mediaContainerWidth);
    // return (currentTime / totalMediaDuration) * mediaContainerWidth;

    const pxValueDiffPerMarker = mediaContainerWidth / totalMediaDuration; // calculating px value which position the marker
    const pixelValuePerStep = pxValueDiffPerMarker / markerInterval; // markerinterval is basically gap bw markers in sec
    const pixelsPerSecond = currentTime * pixelValuePerStep;
    return pixelsPerSecond;
  };

  const fetchVideoData = async (pixelValuePerStep: number): Promise<Clip[]> => {
    const clips = barsDataChangeAfterZoom?.sub_columns?.flatMap((subCol) => {
      return subCol.bars?.map((bar) => {
        const leftPos = bar.left_position;
        // here startTime and endTime would mean diff than resizebar func in timeline
        const startTime = bar.left_position / pixelValuePerStep; // Convert left position to time
        // const endTime = startTime + (bar.duration || 0); //  isn't this wrong here
        const endTime = bar.width / pixelValuePerStep;
        return {
          leftPos,
          startTime,
          endTime,
          videoUrl: bar.url,
        };
      });
    });

    // console.log("Generated Clips:", clips);
    return clips ?? []; // fallback to empty array if undefined
  };

  // todo: throttledShowPhTimeUpdate formatTime are used in playhead, phanimation and timelineRuler file so optimize it
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

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current) {
        videoRef.current.pause(); //pause video
      }
    }
    animationFrameRef.current = null;
    setIsPlaying(false);
  };

  const chooseClip = async () => {
    // pxValueDiffPerMarker gives px value showing diff bw each marker, its gap bw marker in px
    const pxValueDiffPerMarker = mediaContainerWidth / totalMediaDuration; // calculating px value which position the marker

    // pixelValuePerStep is the movement with px value at each step
    // markerinterval is basically gap bw markers in sec
    //pixelValuePerStep is px value, for eg 80 / 2.6 = 30 sec, it would take 2.6px value per step to reach 80px where marker would have 30 sec diff
    const pixelValuePerStep = pxValueDiffPerMarker / markerInterval;

    const clips = await fetchVideoData(pixelValuePerStep);
    const activeClip = clips.find(
      // .find will find and return the first clip which match the condition
      (clip) => 0 >= clip?.startTime && 0 < clip?.endTime
    );
    if (activeClip) {
      dispatch(setCurrentClip(activeClip));
      if (videoRef.current) {
        videoRef.current.play();
        const time = timeToPosition(videoRef.current.currentTime); // change sec into px for playhead move
        if (phPosition === null) {
          setPosition(time);
        } else {
          setPosition(time);
          dispatch(setPhPosition(null));
        }
        throttledShowPhTimeUpdate(videoRef.current.currentTime);
      }
    } else {
      stopAnimation(); // stop after reaching end of the clip
    }
  };

  const syncPlayhead = () => {
    chooseClip();
    animationFrameRef.current = requestAnimationFrame(syncPlayhead);
  };

  // Stop playhead when clicked over timelineruler, while ph is running
  useEffect(() => {
    if (phPosition !== previousPhPositionRef.current) {
      stopAnimation();
      return;
    }

    previousPhPositionRef.current = phPosition;
  }, [phPosition]);

  const startAnimation = async () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (phPosition !== null) {
        setPosition(phPosition);
      }
      animationFrameRef.current = requestAnimationFrame(syncPlayhead);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
