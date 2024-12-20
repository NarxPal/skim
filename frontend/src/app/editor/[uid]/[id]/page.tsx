"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "@/styles/dash.module.css";
import Image from "next/image";
import Left_pane from "../../sidebar/left_pane";
import Sm_pane from "../../sidebar/sm_pane";
import Timeline from "../../canvas/timeline";
import Canvas from "../../canvas/canvas";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { FetchUser } from "@/components/fetchUser";

const UserId = () => {
  const params = useParams<{ uid: string; id: string }>();
  const router = useRouter();

  const [id, setId] = useState<string | null>("");
  const [loadingId, setLoadingId] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const { loading } = FetchUser(params.uid); // calling useeffect to fetch the user_id
  const userId = useSelector((state: RootState) => state.userId.userId); // userid has been set in project/uid

  useEffect(() => {
    const fetchId = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${params.id}`
        );
        setId(response.data.id);
      } catch (error) {
        console.error("Error fetching project with provided id :", error);
        router.push("/auth");
      }
      setLoadingId(false);
    };
    fetchId();
  }, []);

  useEffect(() => {
    if (!loadingId) {
      if (id?.toString() !== params.id) {
        router.push("/auth");
      } else {
        console.log("add pop up here");
      }
    }
  }, [loadingId, params.id, id]);

  useEffect(() => {
    if (!loading) {
      if (userId !== params.uid) {
        router.push("/auth");
      } else {
        console.log("add pop up here");
      }
    }
  }, [userId, loading, params.uid]);

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
              {/* <div className={styles.pf_export_div}>
                <div className={styles.pf}></div>

                <div className={styles.pf}></div>

                <div className={styles.pf}></div>

                <div className={styles.pf}></div>
              </div> */}

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
            <Canvas />
            <Timeline prjId={params.id} />
          </div>

          <div className={styles.right_pane}></div>
        </div>
      </div>
    </div>
  );
};

export default UserId;
