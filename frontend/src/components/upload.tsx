"use client";
import React, { ReactNode, useState, useEffect } from "react";
import styles from "@/styles/sidebar.module.css";
import { supabase } from "../../supabaseClient";

interface MediaUploadProps {
  children: ReactNode;
}

const Upload: React.FC<MediaUploadProps> = ({ children }) => {
  // const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uid, setUid] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const user = await supabase.auth.getUser();
      if (user && user.data.user) {
        setUid(user.data.user.id);
      }
    };
    fetchUser();
  }, []);

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
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

    setUploadMessage("");

    try {
      // uploading files to media bucket
      const fileUploads = files.map(async (file) => {
        const fileType = file.type.startsWith("image")
          ? "image"
          : file.type.startsWith("video")
          ? "video"
          : "audio";
        const filePath = `${uid}/${file.type}/${file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file);
        console.log("storage data bro", data);
        if (uploadError) throw uploadError;

        // inserting metadata along with the media bucket in media_files table
        const { error: insertError } = await supabase
          .from("media_files")
          .insert({
            user_id: uid,
            name: file.name,
            filepath: filePath,
            type: fileType,
            uploaded_at: new Date(),
          });

        if (insertError) {
          console.error("Error saving metadata:", insertError.message);
        } else {
          console.log("File uploaded and metadata saved successfully.");
        }
      });

      await Promise.all(fileUploads);
      setUploadMessage(`${files.length} file(s) uploaded successfully.`);
      // clear the files variable if needed
    } catch (error: any) {
      setUploadMessage("Error uploading files: " + error.message);
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
      {uploadMessage && <p>{uploadMessage}</p>}
    </div>
  );
};

export default Upload;
