"use client";
import React, {
  ReactNode,
  useState,
  useEffect,
  DragEvent,
  ChangeEvent,
} from "react";
import styles from "@/styles/dash.module.css";
import { supabase } from "../../supabaseClient";

interface MediaUploadProps {
  children: ReactNode;
  setVideoPreview: (url: string | null) => void;
}

type MediaItem = {
  signedUrl: string | null;
  name: string;
  filepath: string;
};

const Upload: React.FC<MediaUploadProps> = ({ children, setVideoPreview }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uid, setUid] = useState<string>("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

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

  async function getSignedUrl(filePath: string) {
    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUrl(filePath, 60 * 60);

    if (error) {
      console.error("Error generating signed URL:", error.message);
      return null;
    }
    return data.signedUrl;
  }

  async function fetchUserMediaWithUrls() {
    // Fetch metadata from the media_files table
    const { data: mediaFiles, error } = await supabase
      .from("media_files")
      .select("name, type, filepath")
      .eq("user_id", uid);

    if (error) {
      console.error("Error fetching media metadata:", error.message);
      return [];
    }

    // Generate signed URLs for each file
    const mediaWithUrls = await Promise.all(
      mediaFiles.map(async (file) => {
        const signedUrl = await getSignedUrl(file.filepath);
        return {
          ...file,
          signedUrl,
        };
      })
    );

    return mediaWithUrls;
  }

  useEffect(() => {
    const loadMedia = async () => {
      const media_Items = await fetchUserMediaWithUrls();
      setMediaItems(media_Items);
    };
    loadMedia();

    // Optional: Refresh URLs every hour if needed
    const interval = setInterval(loadMedia, 60 * 60 * 1000); // Refresh every hour
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
      className={styles.sidebar_content}
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

      <div>
        <h2>uploaded media</h2>
      </div>
    </div>
  );
};

export default Upload;
