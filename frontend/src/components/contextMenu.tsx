import React from "react";
import styles from "@/styles/timeline.module.css";

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
            {option.label}
          </div>
        ) : (
          <div
            key={index}
            onClick={() => onOptionClick(option)}
            className={styles.menu_option}
          >
            {option.label}
          </div>
        )
      )}
    </div>
  );
};

export default ContextMenu;
