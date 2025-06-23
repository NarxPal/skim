import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/sidebar.module.css";
import Upload from "@/components/upload";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios, { AxiosResponse } from "axios";
import { FetchUser } from "@/components/fetchUser";
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

const Left_pane = ({ selectedCategory }: { selectedCategory: string }) => {
  const params = useParams<{ uid: string; id: string }>();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaType, setMediaType] = useState<string>("");
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  //useref
  const fileInputRef = useRef<HTMLInputElement>(null);

  FetchUser(params.uid); // calling useeffect to fetch the user_id
  const userId = useSelector((state: RootState) => state.userId.userId);

  useEffect(() => {
    // Fetch media for sidebar based on the selected category
    const fetchMedia = async () => {
      setMediaType(selectedCategory);
      console.log("selected category bro", selectedCategory);
    };

    fetchMedia();
  }, [selectedCategory]);

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
      return filteredMediaFiles;
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
    // Fetch all media for sidebar after uploading
    const loadMedia = async () => {
      const media_Items = await fetchUserMediaWithUrls();
      console.log("media items bro:", media_Items);
      setMediaItems(media_Items);
    };
    loadMedia();
  }, [selectedCategory, userId, uploadingMedia]);

  const fetchDuration = async (
    fileType: string,
    publicUrl: string | undefined
  ) => {
    // also post the ffmpeg req to get the duration of the video & audio media
    if (fileType === "video" && publicUrl) {
      const durationRes: AxiosResponse<number> = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/ffmpeg/duration`,
        {
          params: {
            publicUrl,
          },
        }
      );
      return durationRes.data;
    }
  };

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", reject);
    });
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
      eventOrFiles.target.value = ""; // Allow re-upload of same file
    } else {
      files = Array.from(eventOrFiles);
    }

    if (!files || files.length === 0) return;

    const validFiles = files.filter((file) => {
      const isDuplicate = mediaItems.some((media) => media.name === file.name);
      if (isDuplicate) {
        toast.error("Media already present");
        return false;
      }

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "mp4" && extension !== "mp3") {
        toast.error("Only .mp4 (video) and .mp3 (audio) files are allowed");
        return false;
      }

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        toast(
          <span>
            ⚠️ Large file detected. <br />
            Prefer files under 10MB. <br />
            We could run out of free cloud storage.
          </span>
        );
      }

      return true;
    });

    if (validFiles.length === 0) return;

    const toastId = toast.loading("Uploading media...");
    setUploadingMedia(true);
    try {
      const fileUploads = validFiles.map(async (file) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        const fileType = extension === "mp4" ? "video" : "audio";

        const formData = new FormData();
        formData.append("file", file);

        let postData;
        if (fileType === "video") {
          const ffmpegRes = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/ffmpeg`,
            formData,
            { responseType: "arraybuffer" }
          );
          postData = ffmpegRes.data;
        }

        const { data: uploadRes } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/file/${userId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        console.log("data upload", uploadRes);

        let thumbnailUrl;
        if (fileType === "video") {
          const bufferFormData = new FormData();
          const Thumbfile = new File([postData], `${file.name}.jpg`, {
            type: "image/jpeg",
          });
          bufferFormData.append("file", Thumbfile);
          bufferFormData.append("userId", userId);

          const { data: uploadThumbnailRes } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/thumbnail`,
            bufferFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          thumbnailUrl = uploadThumbnailRes.url;
        }

        let duration;
        if (fileType === "audio") {
          // fetching duration for audio from browser
          duration = await getAudioDuration(uploadRes.url);
        } else {
          // fetching duration for video from ffmpeg
          duration = await fetchDuration(fileType, uploadRes.url);
        }
        const roundedDuration = Math.round(Number(duration));

        await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/media`, {
          user_id: userId,
          project_id: params.id,
          name: file.name,
          filepath: "",
          type: fileType,
          thumbnail_url: fileType === "video" ? thumbnailUrl : "",
          duration: roundedDuration || null,
          url: uploadRes.url || null,
        });
      });

      await Promise.all(fileUploads);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      toast.dismiss(toastId);
      setUploadingMedia(false);
    }
  };
  const handleClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className={styles.left_pane_container}>
      <Upload
        handleFiles={handleFiles}
        handleClick={handleClick}
        fileInputRef={fileInputRef}
      >
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

      <div className={styles.pane_sidebar}>
        <div className={styles.all_media}>
          <div className={styles.media_library}>
            {mediaItems
              .filter(
                (item) => mediaType === "upload" || item.type === mediaType
              ) // show media based upon category selected
              .map((item) => (
                <div
                  key={item.id} // this should be name not filepath
                  className={styles.media_item}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                >
                  <div className={styles.media_details}>
                    <div className={styles.media_icon}>
                      {item.type === "video" && item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.name}
                          className={styles.media_preview}
                        />
                      ) : (
                        <Image
                          src="/audio.png" // for audio media
                          alt={item.name}
                          width={50}
                          height={50}
                          priority={true}
                          className={styles.media_preview}
                        />
                      )}
                    </div>

                    <div className={styles.media_name}>
                      {item.name.length > 20
                        ? item.name.substring(0, 20) + "..."
                        : item.name}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className={styles.up_btn_div} onClick={handleClick}>
        <button className={styles.up_btn}>Upload Media</button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*,audio/*,image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />

      {uploadingMedia && (
        <div className={styles.overlay}>
          <div className={styles.loader}></div>
        </div>
      )}
    </div>
  );
};

export default Left_pane;
