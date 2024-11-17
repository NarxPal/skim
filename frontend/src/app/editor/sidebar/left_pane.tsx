import React, { useState, useEffect } from "react";
import styles from "@/styles/sidebar.module.css";
import Upload from "@/components/upload";
import Image from "next/image";
import { supabase } from "../../../../supabaseClient";

type MediaItem = {
  signedUrl: string | null;
  name: string;
  filepath: string;
  type: string;
  width: string | number;
};

const Left_pane = ({ selectedCategory }: { selectedCategory: string }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaType, setMediaType] = useState<string>("");
  // const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    // Fetch the media based on the selected category
    const fetchMedia = async () => {
      setMediaType(selectedCategory);
      console.log("selected category bro", selectedCategory);
    };

    fetchMedia();
  }, [selectedCategory]);

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
    const user = await supabase.auth.getUser();
    const { data: mediaFiles, error } = await supabase
      .from("media_files")
      .select("name, type, width, filepath")
      .eq("user_id", user.data.user?.id);
    console.log("user id", user.data.user?.id);
    console.log("media files data bro", mediaFiles);

    if (error) {
      console.error("Error fetching media metadata:", error.message);
      return [];
    }

    // Generate signed URLs for each file
    const mediaWithUrls = await Promise.all(
      mediaFiles.map(async (file) => {
        // mapping to generate signed url for every media file
        const signedUrl = await getSignedUrl(file.filepath);
        return {
          ...file,
          signedUrl,
        };
      })
    );

    return mediaWithUrls; // this will return array of media item each containing signed url and metadata
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    item: MediaItem
  ) => {
    const mediaItemData = JSON.stringify(item);
    e.dataTransfer.setData("text/plain", mediaItemData);
  };

  const handleDragEnd = () => {
    // setDraggedItem(null);
    console.log("Drag ended");
  };

  useEffect(() => {
    const loadMedia = async () => {
      console.log("loadmedia ruan");
      const media_Items = await fetchUserMediaWithUrls();
      setMediaItems(media_Items);
      console.log("media items bro:", media_Items);
    };
    loadMedia();
    // Optional: Refresh URLs every hour if needed
    const interval = setInterval(loadMedia, 60 * 60 * 1000); // Refresh every hour
    return () => clearInterval(interval);
  }, [selectedCategory]);

  return (
    <div className={styles.pane_sidebar}>
      <Upload>
        <div className={styles.icon_text}>
          <Image
            src="/upload.png"
            alt="upload"
            height={30}
            width={30}
            priority={true}
            className={styles.upload_icon}
          />
          <span className={styles.pane_text}>
            drop or click to upload your files.
          </span>
        </div>
      </Upload>

      <div className={styles.text_head}>
        <h2>Uploaded Media</h2>
      </div>
      <div className={styles.all_media}>
        <div className={styles.media_library}>
          {mediaItems
            .filter((item) => mediaType === "upload" || item.type === mediaType)
            .map((item) => (
              <div
                key={item.filepath}
                className={styles.media_item}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
              >
                {item.signedUrl && (
                  <img
                    src={item.signedUrl}
                    alt={item.name}
                    className={styles.media_preview}
                  />
                )}
                <p className={styles.media_name}>
                  {item.name.length > 20
                    ? item.name.substring(0, 20) + "..."
                    : item.name}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Left_pane;
