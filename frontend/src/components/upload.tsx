"use client";
import React, { ReactNode, useState } from "react";
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
  const [videoFile, setVideoFile] = useState<File[] | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

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
    // add functionality to not add same filename multiple times
    let files: File[] = [];

    if ("target" in eventOrFiles) {
      files = eventOrFiles.target.files
        ? Array.from(eventOrFiles.target.files)
        : [];
    } else {
      files = Array.from(eventOrFiles);
    }

    if (!files || files.length === 0) {
      console.log("bro return");
      return;
    } else {
      try {
        const formData = new FormData();

        // Loop through the array of files and append them to FormData
        files.forEach((file) => {
          formData.append("file", file); // Append each file
        });

        console.log("formdata:", formData);
        const { data: postData } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/ffmpeg`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("upload thumbnail success file bro:", postData); // upload postdata to supa storage

        // uploading files to media bucket
        const fileUploads = files.map(async (file) => {
          const fileType = file.type.startsWith("image")
            ? "image"
            : file.type.startsWith("video")
            ? "video"
            : "audio";

          const thumbnailPath = `${userId}/${file.type}/thumbnail_${file.name}`; // for thumbnail along with the filename, make sure to have it only for video media type

          const filePath = `${userId}/${file.type}/${file.name}`;

          // storing the media in supabase storage
          const { data, error: uploadError } = await supabase.storage
            .from("media")
            .upload(filePath, file);
          console.log("storage data bro", data);
          if (uploadError) throw uploadError;

          if (fileType === "video") {
            // to have thumbnailData only during video media type
            const { data: thumbnailData, error: thumbnailError } =
              await supabase.storage
                .from("thumbnail")
                .upload(thumbnailPath, Buffer.from(postData.data), {
                  contentType: "image/jpeg",
                });
            console.log("thumbnail storage data", thumbnailData);
            if (thumbnailError) throw thumbnailError;
          }
          // also post the fffmpeg req to get the duration of the video & audio media

          // inserting metadata of the supabase stored media in media_files table in psql
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/media`,
            {
              user_id: userId,
              project_id: params.id,
              name: file.name,
              filepath: filePath,
              type: fileType,
              thumbnail_url: fileType === "video" ? thumbnailPath : "",
              // not using thumbnail_url here since its specific to video media type only
            }
          );
          console.log("bro media post res", response.data);
        });

        await Promise.all(fileUploads);
      } catch (error: unknown) {
        console.error("Upload error:", error);
      }
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
