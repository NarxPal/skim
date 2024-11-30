import React, { useState } from "react";
import styles from "@/styles/modal.module.css";
import axios from "axios";

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
};

const Modal: React.FC<ModalProps> = ({
  openCreateModal,
  setOpenCreateModal,
  params,
  openEditModal,
  setOpenEditModal,
  editPrjData,
  setEditPrjData,
}) => {
  const [filename, setFilename] = useState<string>("");

  const handlePrjName = async () => {
    if ((openCreateModal && !filename) || (!openCreateModal && !editPrjData)) {
      alert("Project name cannot be empty!");
      return;
    }

    if (openCreateModal) {
      try {
        console.log("filename bro", filename);
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`,
          {
            user_id: params,
            name: filename,
          }
        );
        alert("Project created successfully!");
        setFilename("");
        setOpenCreateModal(false);
      } catch (error) {
        console.error("Error inserting project:", error);
        alert("Failed to create project.");
      }
    } else {
      try {
        const response = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${editPrjData.id}`,
          {
            name: editPrjData.filename,
          }
        );
        alert("Project updated successfully!");
        setEditPrjData((prev) => ({ ...prev, filename: "", id: null }));
        setOpenEditModal(false);
      } catch (error) {
        console.error("Error updating project:", error);
        alert("Failed to update project.");
      }
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
    </div>
  );
};

export default Modal;
