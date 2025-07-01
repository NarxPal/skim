import React, { useState } from "react";
import styles from "@/styles/canvas.module.css";
import Image from "next/image";
import PhAnimation from "@/utils/timeline/phAnimation";

// types / interfaces import
import { BarsProp } from "@/interfaces/barsProp";
interface CanvasProps {
  prjId: string;
  canvasHeight: number;
  barsDataChangeAfterZoom: BarsProp | null;
  setBarsDataChangeAfterZoom: React.Dispatch<
    React.SetStateAction<BarsProp | null>
  >;
  mediaContainerWidth: number;
  totalMediaDuration: number;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  phLeftRef: React.RefObject<HTMLDivElement>;
  manualPhLeftRef: React.MutableRefObject<number | null>;
  phLeftRefAfterMediaStop: React.MutableRefObject<number | null>;
  lastClipId: React.MutableRefObject<number | null>;
  mediaParentRef: React.MutableRefObject<HTMLDivElement | null>;
  splitClip: boolean;
  setSplitClip: React.Dispatch<React.SetStateAction<boolean>>;
  stopPhAfterZoom: boolean;
  setStopPhAfterZoom: React.Dispatch<React.SetStateAction<boolean>>;
  setFetchDataAfterSplit: React.Dispatch<React.SetStateAction<boolean>>;
}

const Canvas: React.FC<CanvasProps> = ({
  prjId,
  canvasHeight,
  barsDataChangeAfterZoom,
  mediaContainerWidth,
  totalMediaDuration,
  videoRef,
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
  setFetchDataAfterSplit,
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
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else {
      const vid = video as unknown as {
        webkitRequestFullscreen?: () => void;
        mozRequestFullScreen?: () => void;
        msRequestFullscreen?: () => void;
      };
      vid.webkitRequestFullscreen?.();
      vid.mozRequestFullScreen?.();
      vid.msRequestFullscreen?.();
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
          prjId={prjId}
          videoRef={videoRef}
          mediaContainerWidth={mediaContainerWidth}
          totalMediaDuration={totalMediaDuration}
          barsDataChangeAfterZoom={barsDataChangeAfterZoom}
          phLeftRef={phLeftRef}
          manualPhLeftRef={manualPhLeftRef}
          phLeftRefAfterMediaStop={phLeftRefAfterMediaStop}
          lastClipId={lastClipId}
          setShowPhTime={setShowPhTime}
          mediaParentRef={mediaParentRef}
          splitClip={splitClip}
          setSplitClip={setSplitClip}
          stopPhAfterZoom={stopPhAfterZoom}
          setStopPhAfterZoom={setStopPhAfterZoom}
          setFetchDataAfterSplit={setFetchDataAfterSplit}
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
