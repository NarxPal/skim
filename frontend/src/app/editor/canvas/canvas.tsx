import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/canvas.module.css";
import Image from "next/image";
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
  phLeftRef: React.RefObject<HTMLDivElement>;
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
  phLeftRef,
}) => {
  // redux state hooks

  // usestate hooks
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen(); // for modern browsers
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).mozRequestFullScreen) {
        (videoRef.current as any).mozRequestFullScreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  return (
    <div
      className={styles.canvas}
      style={{ height: `calc(${canvasHeight}% - 4px)` }} // -4 for resize line
    >
      <div className={styles.canvas_content}>
        <video
          ref={videoRef}
          className={styles.video_tag}
          controls={false} // remove default controls
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
        />
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
          phLeftRef={phLeftRef}
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
          <div onClick={handleFullScreen}>
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
