"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../../firebaseConfig";
import styles from "@/styles/dash.module.css";
import Image from "next/image";
import Upload from "@/components/upload";

const UserId = () => {
  const params = useParams<{ uid: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setUid(user.uid);
        }
        setLoading(false);
      });
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (uid !== params.uid) {
        router.push("/auth");
        console.log("Redirecting: uid and params.uid", uid, params.uid);
      } else {
        console.log("You are the user, bro");
      }
    }
  }, [uid, loading, params.uid]);

  // for handling upload through icon
  const handleUpload = () => {};

  return (
    <div className={styles.dash_bg}>
      <div className={styles.head_pane}>
        <div className={styles.dash_header_div}>
          <div className={styles.dash_header}>
            <div className={styles.logo_filename_div}>
              <div className={styles.logo_div}></div>
              <div className={styles.filename_div}>
                <input
                  type="text"
                  placeholder="Untitled project"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.tools}>
              <div className={styles.cd_div}>
                <div className={styles.cursor}>
                  <Image
                    src="/cursor.png"
                    alt="cursor"
                    width={15}
                    height={15}
                    priority={true}
                  />
                </div>

                <div className={styles.drag}>
                  <Image
                    src="/drag.png"
                    alt="drag"
                    width={15}
                    height={15}
                    priority={true}
                  />
                </div>
              </div>

              <div className={styles.vertical_line}></div>

              <div className={styles.ur_div}>
                <div className={styles.undo_div}>
                  <button className={styles.uBtn}>
                    <Image
                      src="/undo.png"
                      alt="undo"
                      width={15}
                      height={15}
                      priority={true}
                    />
                  </button>
                </div>

                <div className={styles.redo_div}>
                  <button className={styles.rBtn}>
                    <Image
                      src="/redo.png"
                      alt="redo"
                      width={15}
                      height={15}
                      priority={true}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.ex_pf}>
              <div className={styles.pf_export_div}>
                <div className={styles.pf}></div>

                <div className={styles.pf}></div>

                <div className={styles.pf}></div>

                <div className={styles.pf}></div>
              </div>

              <div className={styles.export_btn}>
                <button className={styles.btn}>Export</button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.pane_div}>
          <div className={styles.sm_pane}>
            <ul className={styles.ul_items}>
              <li className={styles.li}>
                <Image
                  src="/add.png"
                  alt="add"
                  height={30}
                  width={30}
                  priority={true}
                />
              </li>

              <li className={styles.li} onClick={handleUpload}>
                <Image
                  src="/upload.png"
                  alt="upload"
                  height={30}
                  width={30}
                  priority={true}
                />

                <span className={styles.li_text}>upload</span>
              </li>

              <li className={styles.li}>
                <Image
                  src="/text.png"
                  alt="text"
                  height={30}
                  width={30}
                  priority={true}
                />
                <span className={styles.li_text}>text</span>
              </li>

              <li className={styles.li}>
                <Image
                  src="/video.png"
                  alt="video"
                  height={30}
                  width={30}
                  priority={true}
                />

                <span className={styles.li_text}>video</span>
              </li>

              <li className={styles.li} onClick={handleUpload}>
                <Image
                  src="/audio.png"
                  alt="audio"
                  height={30}
                  width={30}
                  priority={true}
                />

                <span className={styles.li_text}>audio</span>
              </li>
            </ul>
          </div>

          <div className={styles.pane_sidebar}>
            <div className={styles.upload_box}>
              <Upload setVideoPreview={setVideoPreview}>
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
            </div>
          </div>

          <div className={styles.canvas_pane}>
            <div className={styles.canvas}>
              {videoPreview && (
                <div className={styles.video_div}>
                  <video
                    src={videoPreview}
                    controls
                    width="100%"
                    className={styles.video_tag}
                  />
                </div>
              )}
            </div>
            <div className={styles.timeline}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserId;
