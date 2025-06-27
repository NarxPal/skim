import React, { useEffect, useRef } from "react";
import styles from "@/styles/timeline.module.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setPhPosition } from "@/redux/phPosition";
import { setIsPhDragging } from "@/redux/isPhDragging";
import { throttle } from "lodash";

interface PlayheadProps {
  phLeftRef: React.RefObject<HTMLDivElement>;
  mediaContainerWidth: number;
  position: number;
  setPosition: React.Dispatch<React.SetStateAction<number>>;
  scrollPosition: number;
  setScrollPosition: React.Dispatch<React.SetStateAction<number>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  totalDuration: number;
  setShowPhTime: React.Dispatch<React.SetStateAction<string>>;
}

const Playhead: React.FC<PlayheadProps> = ({
  phLeftRef,
  mediaContainerWidth,
  position,
  setPosition,
  scrollPosition,
  setScrollPosition,
  videoRef,
  totalDuration,
  setShowPhTime,
}) => {
  const dispatch = useDispatch();
  //redux state hooks
  const phPosition = useSelector(
    (state: RootState) => state.phPosition.phPosition
  );
  const phPreview = useSelector(
    (state: RootState) => state.phPreview.phPreview
  );
  const isPhDragging = useSelector(
    (state: RootState) => state.isPhDragging.isPhDragging
  );
  const markerInterval = useSelector(
    (state: RootState) => state.markerInterval.markerInterval
  );

  //useref
  const phDivRef = useRef<HTMLDivElement | null>(null); // for calc new position of ph while dragging
  const playheadRef = useRef<HTMLDivElement>(null);

  // for converting ph position px value to time in seconds
  const positionToTime = (pos: number) => {
    const pxValueDiffPerMarker = mediaContainerWidth / totalDuration; // calculating px value which position the marker
    const pxPerSecond = pxValueDiffPerMarker / markerInterval; // markerinterval is basically gap bw markers in sec

    return pos / pxPerSecond;
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

  // Here lodash throttle will help to reduce state update to 50ms
  const throttledSetPosition = useRef(
    throttle((position: number) => dispatch(setPhPosition(position)), 50) // Update every 50ms
  ).current;

  const handlePhScroll = () => {
    if (playheadRef.current) {
      setScrollPosition(playheadRef.current.scrollLeft);
    }
  };

  // It helps playhead container to scroll along with the media_parent_div
  useEffect(() => {
    if (playheadRef.current) {
      playheadRef.current.scrollLeft = scrollPosition; // Sync scroll position for playhead
      const playhead = playheadRef.current;
      playhead.addEventListener("scroll", handlePhScroll);

      return () => {
        playhead.removeEventListener("scroll", handlePhScroll);
      };
    }
  }, [scrollPosition]);

  // new position of ph is being calculated here while dragging
  const handleMousePhHover = (event: MouseEvent): void => {
    if (phDivRef.current && isPhDragging) {
      const rulerBounds = phDivRef.current.getBoundingClientRect();
      const rulerStyle = getComputedStyle(phDivRef.current);
      const paddingLeft = parseInt(rulerStyle.paddingLeft, 10); // 10 ensure no. is int and not string

      const scrollOffset = phDivRef.current.scrollLeft;
      const clientX =
        event.clientX - rulerBounds.left + scrollOffset - paddingLeft;
      const hoverPosition = Math.max(0, Math.floor(clientX));

      if (hoverPosition !== undefined) {
        setPosition(hoverPosition);
        throttledSetPosition(hoverPosition); // Since redux state setPhPosition is causing state limits error
        if (videoRef.current && hoverPosition) {
          const time = positionToTime(hoverPosition);
          videoRef.current.currentTime = time || 0; // in case there is no clip the time would return nothing so fall to 0
          throttledShowPhTimeUpdate(time);
        }
      }
    }
  };

  // Since onmousemove required react mouse event while window in useEffect require its native event as param for handleMousePhHover
  const handleReactMousePhHover = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    handleMousePhHover(event.nativeEvent);
  };

  useEffect(() => {
    if (isPhDragging) {
      const handleMouseMove = (event: MouseEvent): void => {
        handleMousePhHover(event);
      };
      window.addEventListener("mousemove", handleMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [isPhDragging, throttledSetPosition]);

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.preventDefault();
    dispatch(setIsPhDragging(true));
  };

  const handleMouseUp = async () => {
    dispatch(setIsPhDragging(false));
  };

  // For stopping ph drag during mousedown outside the ruler div
  useEffect(() => {
    const handleWindowMouseUp = async () => {
      if (isPhDragging) {
        dispatch(setIsPhDragging(false));
        dispatch(setPhPosition(null));
      }
    };

    if (isPhDragging) {
      window.addEventListener("mouseup", handleWindowMouseUp);
    } else {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isPhDragging]);

  return (
    <div className={styles.ph_container} ref={playheadRef}>
      <div
        className={styles.playhead_div}
        style={{ width: mediaContainerWidth }}
        ref={phDivRef}
      >
        <div
          className={styles.ph_left}
          // style={{
          //   transform: `translateX(${
          //     phPosition !== null ? phPosition : position
          //   }px)`,
          // }}

          //phposition was during drag of playhead, mouse down on ruler and position was used during media play
          // style={{ transform: `translateX(${position}px)` }} // for gap
          ref={phLeftRef}
        >
          <div className={styles.ph_line_notch}>
            <div className={styles.ph_line}>
              <div
                className={
                  isPhDragging
                    ? `${styles.ph_rel_grabbing}`
                    : `${styles.ph_rel_grab}`
                }
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleReactMousePhHover}
              />
              <div className={styles.ph_notch} />
            </div>
          </div>
        </div>
      </div>
      {phPreview !== null && (
        <div
          className={styles.playhead_div_hover}
          style={{ width: mediaContainerWidth }}
        >
          <div
            className={styles.ph_left_hover}
            style={{
              left: `${phPreview}px`,
            }}
          >
            <div className={styles.ph_line_notch}>
              <div className={styles.ph_line_hover}>
                <div className={styles.ph_rel} />
                <div className={styles.ph_notch} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playhead;
