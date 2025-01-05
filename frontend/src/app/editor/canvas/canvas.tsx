import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/canvas.module.css";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import PhAnimation from "@/utils/timeline/phAnimation";

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
}) => {
  // redux state hooks
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );
  const phPosition = useSelector(
    (state: RootState) => state.phPosition.phPosition
  );

  // usestate hooks
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);

  // useRef hooks
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const pxPerMarker = mediaContainerWidth / totalMediaDuration; // calculating px value which position the marker
    const pixelsPerSecond = pxPerMarker / markerInterval;
    const phTime = phPositionInSec / pixelsPerSecond;
    // showPhTime for showing ph time in timeline component
    const showPlaybackTime = await formatTime(phTime);
    if (!isNaN(phTime)) {
      // update showPhTime only when phTime is valid
      setShowPhTime(showPlaybackTime);
    }

    const clips = await fetchVideoData(pixelsPerSecond);

    const activeClip = clips.find(
      // .find will find and return the first clip which match the condition
      (clip) => phTime >= clip?.startTime && phTime < clip?.endTime // should not the current time be based upon ph and not the video tag?
    );
    if (activeClip) {
      setCurrentClip(activeClip);
      // console.log("active CLIP:", activeClip);

      // if (videoRef.current) {
      //   const videoPlaybackTime = phTime - activeClip.startTime; // Adjust phTime relative to the clip
      //   if (!isNaN(videoPlaybackTime)) {
      //     videoRef.current.currentTime = videoPlaybackTime; // Set video playback position
      //   }
      // }
    }
  };

  useEffect(() => {
    if (phPosition) {
      updateClip(phPosition); // when ph is positioned through mousedown on the timeline ruler
    } else {
      updateClip(position); // position during animation
    }
  }, [position, phPosition]);

  return (
    <div
      className={styles.canvas}
      style={{ height: `calc(${canvasHeight}% - 4px)` }} // -4 for resize line
    >
      <div className={styles.canvas_content}>
        {currentClip && (
          <video ref={videoRef} className={styles.video_tag}>
            <source src={currentClip.videoUrl} type="video/mp4" />
          </video>
        )}
      </div>
      <div className={styles.video_btns}>
        <PhAnimation setPosition={setPosition} />

        <div className={styles.vdo_feature_btns}>
          <div>
            <Image
              src="/sound_on.png" // or mute condition add
              width={15}
              height={15}
              alt="sound_on"
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
