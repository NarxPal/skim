import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/canvas.module.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setPhPosition } from "@/redux/phPosition";

interface PhAnimationProps {
  setPosition: React.Dispatch<React.SetStateAction<number>>;
}
const PhAnimation: React.FC<PhAnimationProps> = ({ setPosition }) => {
  const dispatch = useDispatch();

  //redux state hooks
  const phPosition = useSelector(
    (state: RootState) => state.phPosition.phPosition
  );

  // state hooks
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // useRef
  const animationFrameRef = useRef<number | null>(null);
  const previousPhPositionRef = useRef(phPosition);

  // ********** playhead animation *************

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  const movePlayhead = () => {
    // Adjust increment based on timeline speed
    if (phPosition === null) {
      setPosition((prev) => prev + 1);
    } else {
      setPosition((prev) => prev + 1);
      dispatch(setPhPosition(null));
    }

    animationFrameRef.current = requestAnimationFrame(movePlayhead);
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
      animationFrameRef.current = requestAnimationFrame(movePlayhead);
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
      <button className={styles.pb_btn} onClick={startAnimation}>
        Play
      </button>

      <button className={styles.pb_btn} onClick={stopAnimation}>
        pause
      </button>
    </div>
  );
};

export default PhAnimation;
