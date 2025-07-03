import React, { useEffect, useRef } from "react";
import styles from "@/styles/dash.module.css";
import Image from "next/image";
import { bar } from "@/interfaces/barsProp";
import axios from "axios";

interface RightPane {
  barForVolume: bar | null;
  setFetchDataAfterVolChange: React.Dispatch<React.SetStateAction<boolean>>;
}
const RightPane: React.FC<RightPane> = ({
  barForVolume,
  setFetchDataAfterVolChange,
}) => {
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMediaClipForVolume = async () => {
      if (!barForVolume) return;
      const updateClipVolume = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/clips/${barForVolume.id}`
      );

      if (sliderRef.current) {
        const value = updateClipVolume.data.volume;
        sliderRef.current.value = value.toString();
        sliderRef.current.style.background = `linear-gradient(to right, #2a6fff ${
          value * 100
        }%, #ccc ${value * 100}%)`;
      }
    };
    fetchMediaClipForVolume();
  }, [barForVolume]);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    e.target.style.background = `linear-gradient(to right, #2a6fff ${
      value * 100
    }%, #ccc ${value * 100}%)`;
  };

  const handleUpdateVolume = async () => {
    const value = parseFloat(sliderRef.current?.value || "1");
    if (!barForVolume) return;
    const updateClipVolume = await axios.patch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/sub-columns/clips/${barForVolume.id}`,
      {
        ...barForVolume,
        volume: value,
      }
    );
    setFetchDataAfterVolChange(true);
  };

  return (
    <div className={styles.vol_div}>
      {barForVolume ? (
        <div className={styles.icon_text}>
          <div>
            <Image
              alt="vol"
              src="/sound_on.png"
              width={15}
              height={15}
              priority={true}
            />
          </div>
          <input
            type="range"
            ref={sliderRef}
            min="0"
            max="1"
            step="0.01"
            onChange={handleVolume}
            onMouseUp={handleUpdateVolume}
            className="w-40 h-1 rounded appearance-none"
          />
        </div>
      ) : (
        <div>
          <p className={styles.vol_pane_text}>
            tap on any media clip to change its volume or right click on media
            clips and select volume.
          </p>
        </div>
      )}
    </div>
  );
};

export default RightPane;
