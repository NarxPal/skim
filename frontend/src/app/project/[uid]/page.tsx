"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/project.module.css";
import Image from "next/image";
import Modal from "@/components/modal";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setUserId } from "@/redux/userId";

type data = {
  id: number;
  user_id: string;
  name: string;
};

type editPrjData = {
  filename: string;
  id: number | null;
};

const Project = () => {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const dispatch = useDispatch();

  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<data[]>([]);
  const [editPrjData, setEditPrjData] = useState<editPrjData>({
    filename: "",
    id: null,
  });
  const [openDelModal, setOpenDelModal] = useState<boolean>(false);
  const [delPrjData, setDelPrjData] = useState<editPrjData>({
    // both editprj and del have same type, later: no need of both hooks
    filename: "",
    id: null,
  });

  const userId = useSelector((state: RootState) => state.userId.userId);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const token = Cookies.get("access_token");

    const handleGetUser = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${params.uid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("User data:", response.data);
        const res_uid = response.data.user_id;
        dispatch(setUserId(res_uid));
        setLoading(false);
        return response.data;
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/auth");
      }
    };
    if (token) {
      handleGetUser();
    }
  }, [params.uid]);

  useEffect(() => {
    if (!loading) {
      if (userId !== params.uid) {
        router.push("/auth");
      } else {
        console.log("You are the user, bro");
      }
    }
  }, [userId, loading, params.uid]);

  useEffect(() => {
    const fetchPrjData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`
        );
        console.log("bru u want", response.data);
        const data = response.data;
        setData(data);
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error && "response" in error
            ? (error as any)?.response?.data?.message
            : "Failed to fetch projects";
        throw new Error(errorMessage);
      }
    };
    fetchPrjData();
  }, [params.uid, openCreateModal, openEditModal]);

  const handleEditPrj = async (filename: string, id: number) => {
    setOpenEditModal(true);
    setEditPrjData({ filename, id });
  };

  const handleDelPrj = async (filename: string, id: number) => {
    setOpenDelModal(true);
    setDelPrjData({ filename, id });
  };

  const openProject = (id: number) => {
    router.push(`/editor/${params.uid}/${id}`);
  };

  return (
    <div className={styles.bg_div}>
      <div className={styles.col_div}>
        <div className={styles.header}>
          <div className={styles.head_content}>
            <div className={styles.logo}>skim</div>
            <div className={styles.profileBtn}>
              <button className={styles.pf_btn}>
                Narendra Pal <span>&#x25BC;</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.pane_div}>
          <div className={styles.sm_pane}>
            <div className={styles.sm_items}>
              <ul className={styles.sm_icons}>
                <li className={styles.home_icon}>
                  <Image
                    src="/home.png"
                    alt="home"
                    width={20}
                    height={20}
                    priority={true}
                  />
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.left_pane}>
            <div className={styles.left_items}>
              <div className={styles.search_bar_div}>
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
              </div>
              <ul className={styles.left_menu}>
                <li className={styles.left_li}>
                  <Image
                    src="/draft.png"
                    alt="draft"
                    height={20}
                    width={20}
                    priority={true}
                  />

                  <span>All Projects</span>
                </li>

                <li className={styles.left_li}>
                  <Image
                    src="/draft.png"
                    alt="draft"
                    width={20}
                    height={20}
                    priority={true}
                  />
                  <span>Drafts</span>{" "}
                </li>
              </ul>

              <div className={styles.btn_div}>
                <button
                  className={styles.btn}
                  onClick={() => setOpenCreateModal(true)}
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>

          <div className={styles.main_pane}>
            <div className={styles.main_content}>
              <div
                className={styles.create_box_div}
                onClick={() => setOpenCreateModal(true)}
              >
                <div className={styles.create_box}>
                  <Image
                    src="/draft.png"
                    alt="add"
                    height={20}
                    width={20}
                    priority={true}
                  />

                  <span>Create New</span>
                </div>
              </div>

              <div className={styles.user_dirs}>
                <div className={styles.box_col_row}>
                  {data &&
                    data
                      .filter((item) => item.user_id === params.uid)
                      .map((item) => (
                        <div className={styles.prj_box} key={item.id}>
                          <div
                            className={styles.thumbnail}
                            onClick={() => openProject(item.id)}
                          >
                            thumbnail here bro
                          </div>

                          <div className={styles.name_ic}>
                            <div>{item.name}</div>
                            <ul className={styles.icons_ul}>
                              <li
                                className={styles.ic_li}
                                onClick={() =>
                                  handleEditPrj(item.name, item.id)
                                }
                              >
                                <Image
                                  src="/edit.png"
                                  alt="edit"
                                  height={20}
                                  width={20}
                                  priority={true}
                                />
                              </li>
                              <li
                                className={styles.ic_li}
                                onClick={() => handleDelPrj(item.name, item.id)}
                              >
                                <Image
                                  src="/delete.png"
                                  alt="edit"
                                  height={20}
                                  width={20}
                                  priority={true}
                                />
                              </li>
                            </ul>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        openCreateModal={openCreateModal}
        setOpenCreateModal={setOpenCreateModal}
        params={params.uid}
        openEditModal={openEditModal}
        setOpenEditModal={setOpenEditModal}
        editPrjData={editPrjData}
        setEditPrjData={setEditPrjData}
        // todo : no need to maintain separate hooks for edit and del
        delPrjData={delPrjData}
        setDelPrjData={setDelPrjData}
        openDelModal={openDelModal}
        setOpenDelModal={setOpenDelModal}
      />
    </div>
  );
};

export default Project;
