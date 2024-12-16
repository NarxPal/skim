"use client";
import React, { ReactNode } from "react";
import styles from "@/styles/sidebar.module.css";
import { supabase } from "../../supabaseClient"; // here, supabase used for storage
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";
import { FetchUser } from "./fetchUser";
interface MediaUploadProps {
  children: ReactNode;
}

const Upload: React.FC<MediaUploadProps> = ({ children }) => {
  const params = useParams<{ uid: string; id: string }>();

  // const [isUploading, setIsUploading] = useState(false);

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

  const handleFiles = async (
    eventOrFiles: React.ChangeEvent<HTMLInputElement> | FileList
  ) => {
    //using param for both onchange and handledrop
    let files: File[] = [];

    if ("target" in eventOrFiles) {
      files = eventOrFiles.target.files
        ? Array.from(eventOrFiles.target.files)
        : [];
    } else {
      files = Array.from(eventOrFiles);
    }

    try {
      // uploading files to media bucket
      const fileUploads = files.map(async (file) => {
        const fileType = file.type.startsWith("image")
          ? "image"
          : file.type.startsWith("video")
          ? "video"
          : "audio";
        const filePath = `${userId}/${file.type}/${file.name}`;
        // storing the media in supabase storage
        const { data, error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file);
        console.log("storage data bro", data);
        if (uploadError) throw uploadError;

        // inserting metadata of the supabase stored media in media_files table in psql
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/media`,
          {
            user_id: userId,
            project_id: params.id,
            name: file.name,
            filepath: filePath,
            type: fileType,
          }
        );
        console.log("bro media post res", response.data);
      });

      await Promise.all(fileUploads);
    } catch (error: unknown) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
      className={styles.upload_box}
    >
      <input
        type="file"
        id="file-input"
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
