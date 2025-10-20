/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function App() {
  const [text, setText] = useState("");
  const [textCode, setTextCode] = useState("");
  const [files, setFiles] = useState([]);
  const [fileCode, setFileCode] = useState("");
  const [images, setImages] = useState([]);
  const [imageCode, setImageCode] = useState("");
  const [fetchCode, setFetchCode] = useState("");
  const [receivedData, setReceivedData] = useState(null);
  const [errors, setErrors] = useState({
    text: "",
    files: "",
    images: "",
    fetchCode: "",
  });
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState({
    text: false,
    files: false,
    images: false,
    fetch: false
  });

  const handleUpload = async (type) => {
    const formData = new FormData();
    // Reset errors
    setErrors({ text: "", files: "", images: "" });

    if (type === "text") {
      if (!text.trim()) {
        setErrors((prev) => ({ ...prev, text: "Please enter some text!" }));
        return;
      }
      formData.append("text", text);
    } else if (type === "files") {
      if (!files.length) {
        setErrors((prev) => ({
          ...prev,
          files: "Please choose at least one file!",
        }));
        return;
      }
      Array.from(files).forEach((file) => formData.append("files", file));
    } else if (type === "images") {
      if (!images.length) {
        setErrors((prev) => ({
          ...prev,
          images: "Please choose at least one image!",
        }));
        return;
      }
      Array.from(images).forEach((img) => formData.append("files", img));
    }

    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      const code = res.data.code;
      if (type === "text") setTextCode(code);
      else if (type === "files") setFileCode(code);
      else if (type === "images") setImageCode(code);
    } catch (err) {
      alert("Upload failed!");
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFetch = async () => {
    const numericCode = fetchCode.replace(/\D/g, '');
    if (!numericCode || numericCode.length !== 5) {
      setErrors((prev) => ({ ...prev, fetchCode: "Please enter a 5-digit code!" }));
      return;
    }
    setLoading(prev => ({ ...prev, fetch: true }));
    try {
      const res = await axios.get(
        `http://localhost:5000/clipboard/${fetchCode}`
      );
      setReceivedData(res.data);
      setErrors((prev) => ({ ...prev, fetchCode: "" }));
    } catch (err) {
      alert("Invalid code or data not found.");
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  const isImage = (filename) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

  const CopyCode = ({ code }) => {
    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    };

    return (
      <div className="alert alert-success mt-3 d-flex justify-content-between align-items-center">
        <span className="me-2">Code: {code}</span>
        <button className="btn btn-sm btn-outline-primary" onClick={handleCopy}>
          {copiedCode === code ? "✅ Copied!" : "📋 Copy"}
        </button>
      </div>
    );
  };

  return (
    <div className="container py-4 mt-5">
      {/* HERO SECTION */}
      <div className="text-center mb-5 p-4 bg-light rounded shadow">
        <h1 className="display-5 fw-bold text-primary">📋 Apna Online Clipboard</h1>
        <p className="lead mt-3">
          Store and share your <strong>text</strong>, <strong>documents</strong>
          , and <strong>images</strong> easily via unique codes. Just upload and
          fetch data from anywhere, anytime!
        </p>
        <h6>
          <b>Developed By Gyasuddin Ansari</b>
        </h6>
        <div className="text-center mb-5 mt-3">
          <a
           title="Github"
            href="https://github.com/Gyasuddin0786?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
            style={{ borderRadius: "100%" }}
          >
            <img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
              alt="GitHub"
              width="30"
              height="30"
            />
          </a>
          <a
            title="X"
            href="https://x.com/GyasuddinA2081"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
            style={{ borderRadius: "100%" }}
          >
            <img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg"
              alt="GitHub"
              width="30"
              height="30"
            />
          </a>
          <a
            title="LinkedIn"
            href="https://www.linkedin.com/in/gyasuddin-ansari-199b9b2b5/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
            style={{ borderRadius: "100%" }}
          >
            <img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
              alt="GitHub"
              width="30"
              height="30"
            />
          </a>
           <a
              title="Portfolio"
              href="https://gyasu-portfolio.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
              style={{ borderRadius: "100%" }}
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg"
                alt="Portfolio"
                width="30"
                height="30"
              />
            </a>
        </div>
      </div>

      {/* Upload & Fetch Grid */}
      <div className="row g-4">
        {/* Text Upload */}
        <div className="col-md-6">
          <div className="card shadow border-info">
            <div className="card-header bg-info text-white">✏️ Text Upload</div>
            <div className="card-body">
              <textarea
                className="form-control mb-3"
                rows="4"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, text: "" }));
                  }
                }}
                placeholder="Enter your text here..."
              ></textarea>
              {errors.text && (
                <div className="text-danger mb-2">{errors.text}</div>
              )}
              <button
                className="btn btn-info text-white"
                onClick={() => handleUpload("text")}
                disabled={loading.text}
              >
                {loading.text ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Uploading...
                  </>
                ) : (
                  "Upload Text"
                )}
              </button>
              {textCode && <CopyCode code={textCode} />}
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="col-md-6">
          <div className="card shadow border-primary">
            <div className="card-header bg-primary text-white">
              📁 File Upload
            </div>
            <div className="card-body">
              <input
                type="file"
                className="form-control mb-3"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  setFiles(e.target.files);
                  if (e.target.files.length > 0) {
                    setErrors((prev) => ({ ...prev, files: "" }));
                  }
                }}
              />
              {errors.files && (
                <div className="text-danger mb-2">{errors.files}</div>
              )}
              <button
                className="btn btn-primary"
                onClick={() => handleUpload("files")}
                disabled={loading.files}
              >
                {loading.files ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Uploading...
                  </>
                ) : (
                  "Upload Files"
                )}
              </button>
              {fileCode && <CopyCode code={fileCode} />}
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="col-md-6">
          <div className="card shadow border-success">
            <div className="card-header bg-success text-white">
              🖼️ Image Upload
            </div>
            <div className="card-body">
              <input
                type="file"
                className="form-control mb-3"
                multiple
                accept="image/*"
                onChange={(e) => {
                  setImages(e.target.files);
                  if (e.target.files.length > 0) {
                    setErrors((prev) => ({ ...prev, images: "" }));
                  }
                }}
              />
              {errors.images && (
                <div className="text-danger mb-2">{errors.images}</div>
              )}
              <button
                className="btn btn-success"
                onClick={() => handleUpload("images")}
                disabled={loading.images}
              >
                {loading.images ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Uploading...
                  </>
                ) : (
                  "Upload Images"
                )}
              </button>
              {imageCode && <CopyCode code={imageCode} />}
            </div>
          </div>
        </div>

        {/* Fetch Clipboard */}
        <div className="col-md-6">
          <div className="card shadow border-dark">
            <div className="card-header bg-dark text-white">
              🔍 Fetch Clipboard
            </div>
            <div className="card-body">
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Enter 5-digit code..."
                value={fetchCode}
                maxLength="5"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFetchCode(value);
                  setErrors((prev) => ({ ...prev, fetchCode: "" }));
                }}
              />
              {errors.fetchCode && (
                <div className="text-danger mb-2">{errors.fetchCode}</div>
              )}

              <button 
                className="btn btn-dark" 
                onClick={handleFetch}
                disabled={loading.fetch}
              >
                {loading.fetch ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Fetching...
                  </>
                ) : (
                  "Fetch Clipboard Data"
                )}
              </button>

              {receivedData && (
                <div className="mt-4">
                  {receivedData.text && (
                    <>
                      <h5 className="text-success">📑 Text:</h5>
                      <div
                        className="bg-light p-3 rounded position-relative"
                        style={{
                          maxHeight: "150px",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "5px",
                        }}
                      >
                        <p className="mb-0">{receivedData.text}</p>
                        <button
                          className="btn btn-sm btn-outline-primary position-absolute top-0 end-0 m-2"
                          onClick={() => {
                            navigator.clipboard.writeText(receivedData.text);
                          }}
                        >
                          📋 Copy
                        </button>
                      </div>
                    </>
                  )}

                  {receivedData.files && receivedData.files.length > 0 && (
                    <>
                      <h5 className="text-success mt-4">📦 Files:</h5>
                      <ul className="list-group">
                        {receivedData.files.map((file, index) => (
                          <li
                            key={index}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <div>
                              {isImage(file.name) ? (
                                <img
                                  src={`http://localhost:5000/${file.path}`}
                                  alt={file.name}
                                  className="img-thumbnail me-3"
                                  style={{ maxHeight: "100px" }}
                                />
                              ) : (
                                <span>{file.name}</span>
                              )}
                            </div>
                            <a
                              href={`http://localhost:5000/${file.path}`}
                              download
                              target="_blank"
                              className="btn btn-sm btn-outline-success"
                            >
                              ⬇️ Download
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optional Footer Display */}
      <div className="mt-5">
        <section className="bg-white shadow rounded p-4 mt-5">
          <h2 className="mb-3 text-primary">📌About Apna Online Clipboard</h2>
          <p>
            <strong>Online Clipboard</strong> is a lightweight and powerful web
            application that lets you temporarily store and share text, files,
            and images using unique codes. It's built to help you:
          </p>
          <ul className="list-group list-group-flush mb-3">
            <li className="list-group-item">
              ✔️ Share text snippets with teammates
            </li>
            <li className="list-group-item">
              ✔️ Quickly transfer files between devices
            </li>
            <li className="list-group-item">
              ✔️ Upload and retrieve images without login
            </li>
          </ul>
          <hr />
          <p>
            Just upload your data and receive a unique code. Anyone with that
            code can access the uploaded content instantly. It's perfect for
            fast, secure, and temporary data sharing.
          </p>
        </section>
        <section className="card shadow rounded p-4 mt-3">
          <div className="text-center mt-1 mb-1">
            <a
              title="Github"
              href="https://github.com/Gyasuddin0786?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
              style={{ borderRadius: "100%" }}
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                alt="GitHub"
                width="30"
                height="30"
              />
            </a>
            <a
              title="X"
              href="https://x.com/GyasuddinA2081"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
              style={{ borderRadius: "100%" }}
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg"
                alt="GitHub"
                width="30"
                height="30"
              />
            </a>
            <a
              title="LinkedIn"
              href="https://www.linkedin.com/in/gyasuddin-ansari-199b9b2b5/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
              style={{ borderRadius: "100%" }}
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
                alt="GitHub"
                width="30"
                height="30"
              />
            </a>
            <a
              title="Portfolio"
              href="https://gyasu-portfolio.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary  me-2 shadow p-2 bg-light rounded"
              style={{ borderRadius: "100%" }}
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg"
                alt="Portfolio"
                width="30"
                height="30"
              />
            </a>
          </div>
          <div className="text-center py-3">
            Copyright © {new Date().getFullYear()} Online-Clipboard. All rights reserved.
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;