"use client";
import React, { useEffect, useState, useRef } from "react";
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

// types / interfaces import
import { BarsProp } from "@/interfaces/barsProp";
import Right_pane from "../../sidebar/right_pane";

const UserId = () => {
  const params = useParams<{ uid: string; id: string }>();
  const router = useRouter();

  // state hooks
  const [id, setId] = useState<string | null>("");
  const [loadingId, setLoadingId] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [canvasHeight, setCanvasHeight] = useState(50);
  const [barsDataChangeAfterZoom, setBarsDataChangeAfterZoom] =
    useState<BarsProp | null>(null);
  const [mediaContainerWidth, setMediaContainerWidth] = useState<number>(0);
  const [totalMediaDuration, setTotalMediaDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0); // position of ph
  const [showPhTime, setShowPhTime] = useState<string>("00::00::00");
  const [openRightPane, setOpenRightPane] = useState<boolean>(false);

  // useref hooks
  const isDragging = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { loading } = FetchUser(params.uid); // calling useeffect to fetch the user_id
  // redux hooks
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

  const handleResizeMouseDown = () => {
    isDragging.current = true;
  };

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const container = e.currentTarget.getBoundingClientRect();
    const newHeight = ((e.clientY - container.top) / container.height) * 100;
    setCanvasHeight(Math.max(30, Math.min(80, newHeight))); // min 30, max 80
  };

  const handleResizeMouseUp = () => {
    isDragging.current = false;
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
          <div
            className={`${styles.canvas_pane}
            ${openRightPane ? styles.canvas_shrink : styles.canvas_expand}`}
            onMouseUp={handleResizeMouseUp}
            onMouseMove={handleResizeMouseMove}
          >
            <Canvas
              canvasHeight={canvasHeight}
              barsDataChangeAfterZoom={barsDataChangeAfterZoom}
              setBarsDataChangeAfterZoom={setBarsDataChangeAfterZoom}
              mediaContainerWidth={mediaContainerWidth}
              totalMediaDuration={totalMediaDuration}
              position={position}
              setPosition={setPosition}
              setShowPhTime={setShowPhTime}
              videoRef={videoRef}
            />
            <div
              className={styles.resizer}
              onMouseDown={handleResizeMouseDown}
              onMouseUp={handleResizeMouseUp}
            >
              <div className={styles.resizer_pad} />
            </div>
            <Timeline
              prjId={params.id}
              canvasHeight={canvasHeight}
              barsDataChangeAfterZoom={barsDataChangeAfterZoom}
              setBarsDataChangeAfterZoom={setBarsDataChangeAfterZoom}
              mediaContainerWidth={mediaContainerWidth}
              setMediaContainerWidth={setMediaContainerWidth}
              totalMediaDuration={totalMediaDuration}
              setTotalMediaDuration={setTotalMediaDuration}
              position={position}
              setPosition={setPosition}
              setShowPhTime={setShowPhTime}
              showPhTime={showPhTime}
              videoRef={videoRef}
            />
          </div>

          <div
            className={`${styles.right_pane} ${
              openRightPane ? styles.rp_expand : ""
            }`}
          >
            <div className={styles.right_pane_row}>
              {openRightPane && (
                <div className={styles.pane_content}>
                  <Right_pane />
                </div>
              )}
            </div>
          </div>

          <div className={styles.rp_btns}>
            <div className={styles.rp_icon}>
              <button
                className={styles.toggle_btn}
                onClick={() => setOpenRightPane(!openRightPane)}
              >
                <Image
                  alt="controls"
                  src="/controls.png"
                  width={30}
                  height={30}
                  priority={true}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserId;
