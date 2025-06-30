import React from "react";
import styles from "@/styles/timeline.module.css";
import Image from "next/image";

interface ContextMenuProps {
  x: number;
  y: number;
  id: number | null;
  options: { label: string; action: () => void }[];
  visible: boolean;
  onOptionClick: (option: { label: string; action: () => void }) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  // id,
  options,
  // visible, // for having cm transition
  onOptionClick,
}) => {
  return (
    <div
      className={styles.menu_div}
      style={{
        top: y,
        left: x,
      }}
    >
      {options.map((option, index) =>
        option.label === "delete" ? (
          <div
            key={index}
            onClick={() => onOptionClick(option)}
            className={styles.del_option}
          >
            <div className={styles.cm_icon_text}>
              <Image
                src="/delete.png"
                alt="delete"
                width={15}
                height={15}
                priority={true}
              />
              {option.label}
            </div>
          </div>
        ) : (
          <div
            key={index}
            onClick={() => onOptionClick(option)}
            className={styles.menu_option}
          >
            <div className={styles.cm_icon_text}>
              <Image
                src="/sound_on.png"
                alt="sound"
                width={15}
                height={15}
                priority={true}
              />
              {option.label}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ContextMenu;
