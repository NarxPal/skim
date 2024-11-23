"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/project.module.css";
import Image from "next/image";
import Modal from "@/components/modal";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../supabaseClient";

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

  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<data[]>([]);
  const [editPrjData, setEditPrjData] = useState<editPrjData>({
    filename: "",
    id: null,
  });

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
      } else {
        console.log("You are the user, bro");
      }
    }
  }, [uid, loading, params.uid]);

  useEffect(() => {
    const fecthPrjData = async () => {
      const { data, error } = await supabase.from("projects").select();
      if (error) {
        console.error("failed to fetch data:", error);
      } else {
        console.log("data fetched!:", data);
        setData(data);
      }
    };

    fecthPrjData();
  }, [uid, params.uid, openCreateModal, openEditModal]);

  const handleEditPrj = async (filename: string, id: number) => {
    setOpenEditModal(true);
    setEditPrjData({ filename, id });
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
                    data.map((item) => (
                      <div className={styles.prj_box} key={item.id}>
                        <div className={styles.thumbnail}>
                          thumbnail here bro
                        </div>

                        <div className={styles.name_ic}>
                          <div>{item.name}</div>
                          <ul className={styles.icons_ul}>
                            <li
                              className={styles.ic_li}
                              onClick={() => handleEditPrj(item.name, item.id)}
                            >
                              <Image
                                src="/edit.png"
                                alt="edit"
                                height={20}
                                width={20}
                                priority={true}
                              />
                            </li>
                            <li className={styles.ic_li}>
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
      />
    </div>
  );
};

export default Project;
