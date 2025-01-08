import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/canvas.module.css";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import PhAnimation from "@/utils/timeline/phAnimation";
import { throttle } from "lodash";

// types / interfaces import
import { BarsProp, bar } from "@/interfaces/barsProp";
interface CanvasProps {
  canvasHeight: number;
  barsDataChangeAfterZoom: BarsProp | null;
  setBarsDataChangeAfterZoom: React.Dispatch<
    React.SetStateAction<BarsProp | null>
  >;
  mediaContainerWidth: number;
  totalMediaDuration: number;
  position: number;
  setPosition: React.Dispatch<React.SetStateAction<number>>;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

type Clip = {
  startTime: number;
  endTime: number;
  videoUrl: string;
};

const Canvas: React.FC<CanvasProps> = ({
  canvasHeight,
  barsDataChangeAfterZoom,
  setBarsDataChangeAfterZoom, // remove if don't require here
  mediaContainerWidth,
  totalMediaDuration,
  position,
  setPosition,
  setShowPhTime,
  videoRef,
}) => {
  const dispatch = useDispatch();

  // redux state hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );
  const phPosition = useSelector(
    (state: RootState) => state.phPosition.phPosition
  );
  const currentClip = useSelector(
    (state: RootState) => state.currentClip.currentClip
  );

  // usestate hooks
  // const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // useRef hooks

  const fetchVideoData = async (pixelsPerSecond: number): Promise<Clip[]> => {
    const clips = barsDataChangeAfterZoom?.sub_columns?.flatMap((subCol) => {
      return subCol.bars?.map((bar) => {
        const startTime = bar.left_position / pixelsPerSecond; // Convert left position to time
        const endTime = startTime + (bar.duration || 0);

        return {
          startTime,
          endTime,
          videoUrl: bar.url,
        };
      });
    });

    // console.log("Generated Clips:", clips);
    return clips ?? []; // fallback to empty array if undefined
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = async (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, "0")}::${String(mins).padStart(
      2,
      "0"
    )}::${String(secs).padStart(2, "0")}`;
  };

  const updateClip = async (phPositionInSec: number) => {
    const pxValueDiffPerMarker = mediaContainerWidth / totalMediaDuration; // calculating px value which position the marker
    const pixelsPerMarker = pxValueDiffPerMarker / markerInterval; // markerinterval is basically gap bw markers in sec
    const phTime = phPositionInSec / pixelsPerMarker;

    // showPhTime for showing ph time in timeline component
    // const showPlaybackTime = await formatTime(phTime);
    // if (!isNaN(phTime)) {
    // update showPhTime only when phTime is valid
    // }
    const clips = await fetchVideoData(pixelsPerMarker);
    const activeClip = clips.find(
      // .find will find and return the first clip which match the condition
      (clip) => phTime >= clip?.startTime && phTime < clip?.endTime // should not the current time be based upon ph and not the video tag?
    );
    if (activeClip) {
      // setCurrentClip(activeClip);

      // console.log("active CLIP:", activeClip);
      // activeClip.startTime is the left position for the clip

      if (videoRef.current) {
        setShowPhTime(videoRef.current.currentTime.toString());

        const videoPlaybackTime = phTime - activeClip.startTime; // Adjust phTime relative to the clip

        // console.log("phtime bro", phTime);
        // console.log("videoPlaybackTime", videoPlaybackTime);

        // console.log("vdo Playback time", activeClip.startTime);

        if (!isNaN(videoPlaybackTime)) {
          videoRef.current.currentTime = videoPlaybackTime; // Set video playback position
        }
      }
    }
  };

  const throttledUpdateClip = throttle(updateClip, 500); // Limit to once every 100ms

  // useEffect(() => {
  //   if (phPosition) {
  //     throttledUpdateClip(phPosition); // when ph is positioned through mousedown on the timeline ruler
  //   } else {
  //     throttledUpdateClip(position); // position during animation
  //   }
  // }, [position, phPosition]);

  return (
    <div
      className={styles.canvas}
      style={{ height: `calc(${canvasHeight}% - 4px)` }} // -4 for resize line
    >
      <div className={styles.canvas_content}>
        {currentClip && (
          <video ref={videoRef} className={styles.video_tag} controls>
            <source src={currentClip.videoUrl} type="video/mp4" />
          </video>
        )}
      </div>
      <div className={styles.video_btns}>
        <PhAnimation
          setPosition={setPosition}
          position={position}
          videoRef={videoRef}
          mediaContainerWidth={mediaContainerWidth}
          totalMediaDuration={totalMediaDuration}
          barsDataChangeAfterZoom={barsDataChangeAfterZoom}
          setShowPhTime={setShowPhTime}
        />

        <div className={styles.vdo_feature_btns}>
          <div onClick={handleMuteToggle}>
            <Image
              src={isMuted ? "/mute.png" : "/sound_on.png"} // Switch images based on mute state
              width={15}
              height={15}
              alt="sound_toggle"
              priority={true}
              draggable={false}
            />
          </div>
          <div>
            <Image
              src="/fullScreen.png"
              width={15}
              height={15}
              alt="fullscreen"
              priority={true}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
