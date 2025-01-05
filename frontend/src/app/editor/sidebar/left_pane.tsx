import React, { useState, useEffect } from "react";
import styles from "@/styles/sidebar.module.css";
import Upload from "@/components/upload";
import Image from "next/image";
import { supabase } from "../../../../supabaseClient"; // here, supabase is used for storage
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";
import { FetchUser } from "@/components/fetchUser";

type MediaItem = {
  signedUrl: string;
  project_id: number;
  name: string;
  filepath: string;
  id: number;
  type: string;
  thumbnail_url: string; // for video path
};

const Left_pane = ({ selectedCategory }: { selectedCategory: string }) => {
  const params = useParams<{ uid: string; id: string }>();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaType, setMediaType] = useState<string>("");
  // const [draggedItem, setDraggedItem] = useState(null);

  FetchUser(params.uid); // calling useeffect to fetch the user_id
  const userId = useSelector((state: RootState) => state.userId.userId);

  useEffect(() => {
    // Fetch the media based on the selected category
    const fetchMedia = async () => {
      setMediaType(selectedCategory);
      console.log("selected category bro", selectedCategory);
    };

    fetchMedia();
  }, [selectedCategory]);

  async function getPublicUrl(
    file: MediaItem,
    filePath: string,
    thumbnailUrl: string
  ) {
    if (file.type === "video") {
      const { data } = supabase.storage
        .from("thumbnail")
        .getPublicUrl(thumbnailUrl);
      console.log("getpublic url data for video:", data);
      return data.publicUrl;
    } else {
      const { data } = supabase.storage.from("media").getPublicUrl(filePath);

      console.log("getpublic url data for media:", data);
      return data.publicUrl;
    }
  }

  async function fetchUserMediaWithUrls(): Promise<MediaItem[]> {
    // Fetch metadata from the media_files table
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/${userId}`
      );

      const mediaFiles = res.data; // all the media stored for a userId

      const filteredMediaFiles = mediaFiles.filter(
        (file: MediaItem) => file.project_id === Number(params.id)
      );

      // Generate signed URLs for each file
      const mediaWithUrls = await Promise.all(
        filteredMediaFiles.map(async (file: MediaItem) => {
          // mapping to generate signed url for every media file
          const signedUrl = await getPublicUrl(
            file,
            file.filepath,
            file.thumbnail_url
          ); // here getting public url through filepath present in db
          return {
            ...file,
            signedUrl, // this is public url and is permanent, named as signedUrl everywhere
          };
          // signedUrl will contain the path that will show the image for any media type
        })
      );
      return mediaWithUrls; // signedUrl is not saved into db(for img it contain the img url and for video it contains the thumbnail url)
    } catch (error) {
      console.log("error fetching media", error);
      return [];
    }
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    item: MediaItem
  ) => {
    const mediaItemData = JSON.stringify(item);
    e.dataTransfer.setData("text/plain", mediaItemData);
    // this dragged data will be fetched in timeline.tsx handleMediaDrop func
  };

  const handleDragEnd = () => {
    // setDraggedItem(null);
    console.log("Drag ended");
  };

  useEffect(() => {
    const loadMedia = async () => {
      const media_Items = await fetchUserMediaWithUrls(); // optimize: since i have saved the url for video and image i don't have to do getpublicurl everytime so change this later
      console.log("media items bro:", media_Items);
      setMediaItems(media_Items);
    };
    loadMedia();
  }, [selectedCategory, userId]);

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

      {/* <div className={styles.search_bar_div}>
        <div className={styles.search_bar}>
          <Image
            src="/search.png"
            alt="search"
            width={20}
            height={20}
            priority={true}
          />
          <input
            placeholder="search your projects"
            className={styles.input_bar}
          />
        </div>
      </div> */}

      <div className={styles.text_head}>
        <h2>Uploaded Media</h2>
      </div>
      <div className={styles.all_media}>
        <div className={styles.media_library}>
          {mediaItems
            .filter((item) => mediaType === "upload" || item.type === mediaType) // show media based upon category selected
            .map((item) => (
              <div
                key={item.filepath} // this should be name not filepath
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

      <div className={styles.up_btn_div}>
        <button className={styles.up_btn}>Upload Media</button>
      </div>
    </div>
  );
};

export default Left_pane;
