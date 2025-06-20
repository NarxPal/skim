"use client";
import React, { ReactNode } from "react";
import styles from "@/styles/sidebar.module.css";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { FetchUser } from "./fetchUser";

interface MediaUploadProps {
  children: ReactNode;
  handleFiles: (e: React.ChangeEvent<HTMLInputElement> | FileList) => void;
  handleClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}
const Upload: React.FC<MediaUploadProps> = ({
  children,
  handleFiles,
  handleClick,
  fileInputRef,
}) => {
  const params = useParams<{ uid: string; id: string }>();

  FetchUser(params.uid); // calling useeffect to fetch the user_id

  const userId = useSelector((state: RootState) => state.userId.userId);

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) handleFiles(files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={styles.upload_box}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*,audio/*,image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />
      {children}
      {/* {uploadMessage && <p>{uploadMessage}</p>} */} {/* pop msg for this */}
    </div>
  );
};

export default Upload;
