import React, { ReactNode, useState, DragEvent, ChangeEvent } from 'react';
import styles from "@/styles/dash.module.css"

interface MediaUploadProps {
  children: ReactNode;
}

const Upload: React.FC<MediaUploadProps> = ({ children }) => {
  const [files, setFiles] = useState<File[]>([]);

  // Handle files from drag-and-drop or file input
  const handleFiles = (selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    setFiles((prevFiles) => [...prevFiles, ...fileArray]);
  };

  // Drag and Drop Handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  // File Input Handler
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      className={styles.icon_text}
    >
      <input
        type="file"
        id="file-input"
        accept="video/*,audio/*,image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
{children}

      {/* Display uploaded files */}
      <div className="file-preview">
        {files.map((file, index) => (
          <div key={index}>
            <p className={styles.pane_text}>{file.name} - {file.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Upload;