"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import { usePathname } from "next/navigation";
import styles from "@/styles/dash.module.css";
import Image from "next/image";
import { supabase } from "../../../../supabaseClient";
import Left_pane from "../sidebar/left_pane";
import Sm_pane from "../sidebar/sm_pane";
import Timeline from "../canvas/timeline";
import Project from "@/app/project/[uid]/page";

const UserId = () => {
  const params = useParams<{ uid: string }>();
  const router = useRouter();

  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  // const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  useEffect(() => {
    const fetchUser = async () => {
      const user = await supabase.auth.getUser();
      if (user && user.data.user) {
        setUid(user.data.user.id);
      }
      setLoading(false);
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

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

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
          <Sm_pane onCategorySelect={handleTabClick} />
          <Left_pane selectedCategory={activeTab} />
          <div className={styles.canvas_pane}>
            <div className={styles.canvas}>
              {/* {videoPreview && (
                <div className={styles.video_div}>
                  <video
                    src={videoPreview}
                    controls
                    width="100%"
                    className={styles.video_tag}
                  />
                </div>
              )} */}
            </div>
            <Timeline />
          </div>
        </div>
      </div>

      {/* <Project /> */}
    </div>
  );
};

export default UserId;
