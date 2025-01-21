import React, { useState, useRef } from "react";
import styles from "@/styles/canvas.module.css";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import PhAnimation from "@/utils/timeline/phAnimation";
// import { throttle } from "lodash";

// types / interfaces import
import { BarsProp } from "@/interfaces/barsProp";
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

const Canvas: React.FC<CanvasProps> = ({
  canvasHeight,
  barsDataChangeAfterZoom,
  mediaContainerWidth,
  totalMediaDuration,
  position,
  setPosition,
  setShowPhTime,
  videoRef,
}) => {
  // redux state hooks
  const currentClip = useSelector(
    (state: RootState) => state.currentClip.currentClip
  );

  // usestate hooks
  // const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // useRef hooks
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // const fetchVideoData = async (pixelsPerSecond: number): Promise<Clip[]> => {
  //   const clips = barsDataChangeAfterZoom?.sub_columns?.flatMap((subCol) => {
  //     return subCol.bars?.map((bar) => {
  //       const startTime = bar.left_position / pixelsPerSecond; // Convert left position to time
  //       const endTime = startTime + (bar.duration || 0);

  //       return {
  //         startTime,
  //         endTime,
  //         videoUrl: bar.url,
  //       };
  //     });
  //   });

  //   // console.log("Generated Clips:", clips);
  //   return clips ?? []; // fallback to empty array if undefined
  // };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className={styles.canvas}
      style={{ height: `calc(${canvasHeight}% - 4px)` }} // -4 for resize line
    >
      <div className={styles.canvas_content}>
        {/*
       <canvas ref={canvasRef} className={styles.canvas_tag}>
        </canvas> 
 */}
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
          canvasRef={canvasRef}
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
