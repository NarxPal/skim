import React, { useState } from "react";
import styles from "@/styles/modal.module.css";
import axios from "axios";
import toast from "react-hot-toast";

type EditPrjData = {
  filename: string;
  id: number | null;
};

type ModalProps = {
  openCreateModal: boolean;
  setOpenCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  params: string;
  openEditModal: boolean;
  setOpenEditModal: React.Dispatch<React.SetStateAction<boolean>>;
  editPrjData: EditPrjData;
  setEditPrjData: React.Dispatch<React.SetStateAction<EditPrjData>>;

  openDelModal: boolean;
  setOpenDelModal: React.Dispatch<React.SetStateAction<boolean>>;
  delPrjData: EditPrjData;
  setDelPrjData: React.Dispatch<React.SetStateAction<EditPrjData>>;
};

type projectProps = {
  id: number;
  name: string;
  user_id: string;
};

const Modal: React.FC<ModalProps> = ({
  openCreateModal,
  setOpenCreateModal,
  params,
  openEditModal,
  setOpenEditModal,
  editPrjData,
  setEditPrjData,

  openDelModal,
  setOpenDelModal,
  delPrjData,
  setDelPrjData,
}) => {
  const [filename, setFilename] = useState<string>("");

  const createRootColumn = async (prjData: projectProps) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/columns`, {
        project_id: prjData.id,
        user_id: prjData.user_id,
        parent_id: null, // since this is the creation of root column after creating project
      });
    } catch (error) {
      console.error("error creating column", error);
    }
  };

  const deleteRootColumn = async (projectId: number | null) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/columns/${projectId}`
      );
      setDelPrjData((prev) => ({ ...prev, filename: "", id: null }));
    } catch {
      toast.error("error deleting project");
    }
  };

  const handlePrjName = async () => {
    if ((openCreateModal && !filename) || (!openCreateModal && !editPrjData)) {
      toast.error("Project name cannot be empty!");
      return;
    }

    if (openCreateModal) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`,
          {
            user_id: params,
            name: filename,
          }
        );
        setFilename("");
        setOpenCreateModal(false);
        createRootColumn(response.data);
      } catch (error) {
        console.error("Error inserting project:", error);
        toast.error("Failed to create project");
      }
    } else {
      try {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${editPrjData.id}`,
          {
            name: editPrjData.filename,
          }
        );
        setEditPrjData((prev) => ({ ...prev, filename: "", id: null }));
        setOpenEditModal(false);
      } catch (error) {
        console.error("Error updating project:", error);
        toast.error("Failed to update project.");
      }
    }
  };

  const handleDelPrj = async () => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${delPrjData.id}`
      );
      setOpenDelModal(false);
      deleteRootColumn(delPrjData.id);
    } catch (error) {
      console.log("error deleting project", error);
    }
  };

  return (
    <div>
      {(openCreateModal || openEditModal) && (
        <div
          className={styles.modal_bg}
          onClick={() =>
            openCreateModal
              ? setOpenCreateModal(false)
              : setOpenEditModal(false)
          }
        >
          <div
            className={styles.modal_div}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modal_content}>
              <div>Project Name</div>
              <div className={styles.input_div}>
                <input
                  type="text"
                  placeholder="project name"
                  className={styles.input}
                  onChange={(e) => {
                    if (openCreateModal) {
                      setFilename(e.target.value);
                    } else {
                      setEditPrjData((prev) => ({
                        ...prev,
                        filename: e.target.value,
                      }));
                    }
                  }}
                  value={openEditModal ? editPrjData.filename : filename}
                />
              </div>

              <div className={styles.btn_div}>
                <button className={styles.btn} onClick={() => handlePrjName()}>
                  {openCreateModal ? "Create" : "Edit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openDelModal && (
        <div className={styles.modal_bg} onClick={() => setOpenDelModal(false)}>
          <div
            className={styles.modal_div}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modal_content}>
              <div>Delete Project</div>
              <div>
                <p>
                  are you sure you want to delete project{" "}
                  <span>{`"${delPrjData.filename}"`}</span> &#63;
                </p>
              </div>
              <div className={styles.btn_div}>
                <button
                  className={styles.del_btn}
                  onClick={() => handleDelPrj()}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modal;
