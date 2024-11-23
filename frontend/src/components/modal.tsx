import React, { useState } from "react";
import styles from "@/styles/modal.module.css";
import { supabase } from "../../supabaseClient";

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
      const { data, error } = await supabase
        .from("projects")
        .insert([{ user_id: params, name: filename }]);

      if (error) {
        console.error("Error inserting project:", error);
        alert("Failed to create project.");
      } else {
        console.log("Project created successfully:", data);
        alert("Project created successfully!");
        setFilename("");
        setOpenCreateModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from("projects")
        .update({ name: editPrjData.filename })
        .eq("id", editPrjData.id);

      if (error) {
        console.error("Error updating project:", error);
        alert("Failed to update project.");
      } else {
        console.log("Project updated successfully:", data);
        alert("Project updated successfully!");
        setEditPrjData((prev) => ({ ...prev, filename: "", id: null }));
        setOpenEditModal(false);
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
