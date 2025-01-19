"use client";
import React, { ReactNode } from "react";
import styles from "@/styles/sidebar.module.css";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios, { AxiosResponse } from "axios";
import { FetchUser } from "./fetchUser";
import toast from "react-hot-toast";

type MediaItem = {
  project_id: number;
  name: string;
  filepath: string;
  id: number;
  type: string;
  thumbnail_url: string; // for video path
  url: string;
};
interface MediaUploadProps {
  children: ReactNode;
  setUploadingMedia: React.Dispatch<React.SetStateAction<boolean>>;
  mediaItems: MediaItem[];
}
const Upload: React.FC<MediaUploadProps> = ({
  children,
  setUploadingMedia,
  mediaItems,
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

  const fetchDuration = async (
    fileType: string,
    publicUrl: string | undefined
  ) => {
    // also post the fffmpeg req to get the duration of the video & audio media
    if ((fileType === "video" || "audio") && publicUrl) {
      const durationRes: AxiosResponse<number> = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/ffmpeg/duration/${publicUrl}`
        // publicUrl here as filepath for video media
      );
      return durationRes.data;
    }
  };

  const handleFiles = async (
    eventOrFiles: React.ChangeEvent<HTMLInputElement> | FileList
  ) => {
    //using param for both onchange and handledrop
    // add functionality to not add same filename multiple times
    let files: File[] = [];

    if ("target" in eventOrFiles) {
      // for input img
      files = eventOrFiles.target.files
        ? Array.from(eventOrFiles.target.files)
        : [];
    } else {
      // for drag and drop
      files = Array.from(eventOrFiles);
    }

    if (!files || files.length === 0) {
      return;
    } else {
      setUploadingMedia(true);
      try {
        const fileUploads = files.map(async (file) => {
          const isDuplicate = mediaItems.some(
            (media) => media.name === file.name
          );
          if (isDuplicate) {
            toast.error("media already present");
            return;
          } else {
            const fileType = file.type.startsWith("image")
              ? "image"
              : file.type.startsWith("video")
              ? "video"
              : "audio";

            const formData = new FormData();
            formData.append("file", file); // only single file

            let postData;
            if (fileType === "video") {
              // using first frame from video as img for thumbnail
              const ffmpegRes = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/ffmpeg`,
                formData,
                { responseType: "arraybuffer" }
              );
              postData = ffmpegRes.data; // using byte array only present inside data
            }

            const { data: uploadRes } = await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/file/${userId}`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            let thumbnailUrl;
            if (fileType === "video") {
              // to have thumbnailData only during video media type

              const bufferFormData = new FormData();
              const Thumbfile = new File([postData], `${file.name}.jpg`, {
                type: "image/jpeg",
              });
              bufferFormData.append("file", Thumbfile);
              bufferFormData.append("userId", userId);

              try {
                const { data: uploadThumbnailRes } = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/thumbnail`,
                  bufferFormData,
                  {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  }
                );
                thumbnailUrl = uploadThumbnailRes.url;
              } catch (error: unknown) {
                console.error("error uploading thumbnail", error);
              }
            }

            const duration = await fetchDuration(fileType, uploadRes.url);
            const roundedDuration = Math.round(Number(duration));

            // inserting metadata of the cloudinary stored media in media_files table in psql
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/media`,
              {
                user_id: userId,
                project_id: params.id,
                name: file.name,
                filepath: "", // check and remove filepath since it's of no use while using cloudinary
                type: fileType,
                thumbnail_url: fileType === "video" ? thumbnailUrl : "",
                duration: roundedDuration || null, // will use it as width for clip, null for image
                url: uploadRes.url || null, // this url would work for video, image media type, null for audio
              }
            );
            console.log("bro media post res", response.data);
          }
        });

        await Promise.all(fileUploads);
        setUploadingMedia(false);
      } catch (error: unknown) {
        console.error("Upload error:", error);
        setUploadingMedia(false);
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
