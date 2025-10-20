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
  const [copiedText, setCopiedText] = useState(false);
  const [loading, setLoading] = useState({
    text: false,
    files: false,
    images: false,
    fetch: false
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [recentCodes, setRecentCodes] = useState(() => {
    const saved = localStorage.getItem('recentCodes');
    const codes = saved ? JSON.parse(saved) : [];
    // Filter out expired codes (older than 10 minutes)
    const validCodes = codes.filter(item => {
      if (typeof item === 'string') return false; // Old format
      const minutesPassed = (Date.now() - item.timestamp) / (1000 * 60);
      return minutesPassed < 10;
    });
    if (validCodes.length !== codes.length) {
      localStorage.setItem('recentCodes', JSON.stringify(validCodes));
    }
    return validCodes;
  });
  const [uploadStats, setUploadStats] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('uploadStats');
    const stats = saved ? JSON.parse(saved) : { date: today, count: 0 };
    return stats.date === today ? stats : { date: today, count: 0 };
  });
  const [dragActive, setDragActive] = useState(false);

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
      const res = await axios.post("https://clipboard-1q6x.onrender.com/upload", formData);
      const code = res.data.code;
      if (type === "text") setTextCode(code);
      else if (type === "files") setFileCode(code);
      else if (type === "images") setImageCode(code);
      
      // Save to recent codes with timestamp
      const codeWithTime = { code, timestamp: Date.now() };
      const newRecentCodes = [codeWithTime, ...recentCodes.filter(c => c.code !== code)].slice(0, 5);
      setRecentCodes(newRecentCodes);
      localStorage.setItem('recentCodes', JSON.stringify(newRecentCodes));
      
      // Update stats
      const newStats = { ...uploadStats, count: uploadStats.count + 1 };
      setUploadStats(newStats);
      localStorage.setItem('uploadStats', JSON.stringify(newStats));
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
        `https://clipboard-1q6x.onrender.com/clipboard/${fetchCode}`
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

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (type === 'files') {
      setFiles(droppedFiles);
    } else if (type === 'images') {
      setImages(droppedFiles);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const shareCode = (code) => {
    if (navigator.share) {
      navigator.share({
        title: 'Clipboard Code',
        text: `Use this code to access shared content: ${code}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${window.location.href}?code=${code}`);
    }
  };

  const QRCodeComponent = ({ code }) => {
    const qrValue = `${window.location.href}?code=${code}`;
    return (
      <div className="text-center mt-2">
        <div className="d-inline-block p-2 bg-white rounded">
          <div 
            style={{
              width: '80px',
              height: '80px',
              background: `url("https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrValue)}") center/contain no-repeat`
            }}
          ></div>
        </div>
        <div className="small text-muted mt-1">Scan QR Code</div>
      </div>
    );
  };

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
    <div className={`container-fluid  ${darkMode ? 'bg-dark text-light' : ''}`}>
      {/* Dark Mode Toggle */}
      <div className="text-end mb-3">
        <button title="Theme"
          className={`btn mt-2 ${darkMode ? 'btn-light' : 'btn-dark'} btn-sm`}
          onClick={() => {
                const newMode = !darkMode;
                setDarkMode(newMode);
                localStorage.setItem('darkMode', JSON.stringify(newMode));
              }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="alert alert-info mb-4">
        <div className="row text-center">
          <div className="col-md-4">
            <strong>📊 Today's uploads: {uploadStats.count}</strong>
          </div>
          <div className="col-md-4">
            <strong>⏰ Auto-delete: 10 minutes</strong>
          </div>
          <div className="col-md-4">
            <strong>📁 Max size: 5MB per file</strong>
          </div>
        </div>
      </div>

      {/* Recent Codes */}
      {recentCodes.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">📋 Recent Codes</h6>
          </div>
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2">
              {recentCodes.map((item, idx) => (
                <button
                  key={idx}
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setFetchCode(item.code)}
                  title={`Expires in ${Math.max(0, 10 - Math.floor((Date.now() - item.timestamp) / (1000 * 60)))}m`}
                >
                  {item.code} ({Math.max(0, 10 - Math.floor((Date.now() - item.timestamp) / (1000 * 60)))}m)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className={`text-center mb-5 p-4 ${darkMode ? 'bg-secondary' : 'bg-light'} rounded shadow`}>
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
            <div className="card-header bg-info text-white">✏️ Text upload</div>
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
              <div className="small text-muted mb-2">
                Character count: {text.length} | Max: 10,000 characters
              </div>
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
              {textCode && (
                <>
                  <CopyCode code={textCode} />
                  <div className="row mt-2">
                    <div className="col-6">
                      <QRCodeComponent code={textCode} />
                    </div>
                    <div className="col-6 d-flex align-items-center">
                      <button 
                        className="btn btn-outline-success btn-sm w-100"
                        onClick={() => shareCode(textCode)}
                      >
                        📤 Share Code
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="col-md-6">
          <div className="card shadow border-primary">
            <div className="card-header bg-primary text-white">
              📁 File upload
            </div>
            <div className="card-body">
              <div 
                className={`border-2 border-dashed p-4 mb-3 text-center ${dragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'files')}
              >
                <input
                  type="file"
                  className="form-control mb-2"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    setFiles(e.target.files);
                    if (e.target.files.length > 0) {
                      setErrors((prev) => ({ ...prev, files: "" }));
                    }
                  }}
                />
                <div className="mt-2">
                  📁 Drag & Drop files here or click to browse
                  <br />
                  <small className="text-muted">Supported: PDF, DOC, DOCX, TXT (Max 5MB)</small>
                </div>
              </div>
              
              {/* File Preview */}
              {files.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted">Selected Files:</small>
                  {Array.from(files).map((file, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center border rounded p-2 mt-1">
                      <span className="small">{file.name}</span>
                      <span className="badge bg-secondary">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              )}
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
              {fileCode && (
                <>
                  <CopyCode code={fileCode} />
                  <div className="row mt-2">
                    <div className="col-6">
                      <QRCodeComponent code={fileCode} />
                    </div>
                    <div className="col-6 d-flex align-items-center">
                      <button 
                        className="btn btn-outline-success btn-sm w-100"
                        onClick={() => shareCode(fileCode)}
                      >
                        📤 Share Code
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="col-md-6">
          <div className="card shadow border-success">
            <div className="card-header bg-success text-white">
              🖼️ Image upload
            </div>
            <div className="card-body">
              <div 
                className={`border-2 border-dashed p-4 mb-3 text-center ${dragActive ? 'border-success bg-light' : 'border-secondary'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'images')}
              >
                <input
                  type="file"
                  className="form-control mb-2"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    setImages(e.target.files);
                    if (e.target.files.length > 0) {
                      setErrors((prev) => ({ ...prev, images: "" }));
                    }
                  }}
                />
                <div className="mt-2">
                  🖼️ Drag & Drop images here or click to browse
                  <br />
                  <small className="text-muted">Supported: JPG, PNG, GIF, WebP (Max 5MB)</small>
                </div>
              </div>
              
              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted">Selected Images:</small>
                  <div className="row mt-2">
                    {Array.from(images).map((img, idx) => (
                      <div key={idx} className="col-4 mb-2">
                        <div className="position-relative">
                          <img 
                            src={URL.createObjectURL(img)} 
                            className="img-thumbnail w-100" 
                            style={{height: '80px', objectFit: 'cover'}}
                            alt="Preview"
                          />
                          <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center small">
                            {formatFileSize(img.size)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              {imageCode && (
                <>
                  <CopyCode code={imageCode} />
                  <div className="row mt-2">
                    <div className="col-6">
                      <QRCodeComponent code={imageCode} />
                    </div>
                    <div className="col-6 d-flex align-items-center">
                      <button 
                        className="btn btn-outline-success btn-sm w-100"
                        onClick={() => shareCode(imageCode)}
                      >
                        📤 Share Code
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Fetch Clipboard */}
        <div className="col-md-6">
          <div className="card shadow border-dark">
            <div className="card-header bg-dark text-white">
              🔍 Fetch clipboard
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
                            setCopiedText(true);
                            setTimeout(() => setCopiedText(false), 2000);
                          }}
                        >
                          {copiedText ? "✅ Copied!" : "📋 Copy"}
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
                                  src={`https://clipboard-1q6x.onrender.com/${file.path}`}
                                  alt={file.name}
                                  className="img-thumbnail me-3"
                                  style={{ maxHeight: "100px" }}
                                />
                              ) : (
                                <span>{file.name}</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDownload(`https://clipboard-1q6x.onrender.com/${file.path}`, file.name)}
                              className="btn btn-sm btn-outline-success"
                            >
                              ⬇️ Download
                            </button>
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
        <section className={`shadow rounded p-4 mt-5 ${darkMode ? 'bg-secondary' : 'bg-white'}`}>
          <h2 className="mb-3 text-primary">📌About Apna Online Clipboard</h2>
          <p>
            <strong>Online Clipboard</strong> is a lightweight and powerful web
            application that lets you temporarily store and share text, files,
            and images using unique codes. It's built to help you:
          </p>
          <ul className="list-group list-group-flush mb-3">
            <li className={`list-group-item ${darkMode ? 'bg-secondary text-light' : ''}`}>
              ✔️ Share text snippets with teammates
            </li>
            <li className={`list-group-item ${darkMode ? 'bg-secondary text-light' : ''}`}>
              ✔️ Quickly transfer files between devices
            </li>
            <li className={`list-group-item ${darkMode ? 'bg-secondary text-light' : ''}`}>
              ✔️ Upload and retrieve images without login
            </li>
          </ul>
          <hr />
          <p>
            Just upload your data and receive a unique code. Anyone with that
            code can access the uploaded content instantly. It's perfect for
            fast, secure, and temporary data sharing.
          </p>
          
          <div className="row mt-4">
            <div className="col-md-6">
              <h3 className="text-primary mb-3">🚀 Key Features</h3>
              <div className="row">
                <div className="col-6 mb-2">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-primary me-2">⚡</span>
                    <small>Lightning Fast</small>
                  </div>
                </div>
                <div className="col-6 mb-2">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success me-2">🔒</span>
                    <small>Auto-Delete</small>
                  </div>
                </div>
                <div className="col-6 mb-2">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-info me-2">📱</span>
                    <small>QR Codes</small>
                  </div>
                </div>
                <div className="col-6 mb-2">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-warning me-2">🎯</span>
                    <small>Multi-Format</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-center">
              <div className={`p-3 rounded  ${darkMode ? 'text-light' : 'bg-light'}`}>
                <h6 className={`mb-2 ${darkMode ? 'text-warning' : 'text-success'}`}>📊 Today's Stats</h6>
                <div className="d-flex justify-content-center gap-4">
                  <div>
                    <span className={`h5 ${darkMode ? 'text-info' : 'text-primary'}`}>{uploadStats.count}</span>
                    <br />
                    <small className={darkMode ? 'text-light' : 'text-muted'}>Uploads</small>
                  </div>
                  <div>
                    <span className={`h5 ${darkMode ? 'text-warning' : 'text-info'}`}>{recentCodes.length}</span>
                    <br />
                    <small className={darkMode ? 'text-light' : 'text-muted'}>Active</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={`card shadow rounded p-4 mt-3 ${darkMode ? 'bg-secondary text-light' : ''}`}>
          <div className="text-center mt-1 mb-1">
            <a
              title="Github"
              href="https://github.com/Gyasuddin0786?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-outline-primary me-2 shadow p-2 rounded bg-light`}
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
              className={`btn btn-outline-primary me-2 shadow p-2 rounded bg-light`}
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
              className={`btn btn-outline-primary me-2 shadow p-2 bg-light rounded `}
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
              className={`btn btn-outline-primary me-2 shadow p-2 bg-light rounded`}
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
            <div className="mb-2">
              <span className="badge bg-primary me-2">Made with ❤️ in India</span>
              <span className="badge bg-success me-2">Open Source</span>
              <span className="badge bg-info">Free Forever</span>
            </div>
            <div className={`${darkMode ? 'text-light' : 'text-muted'}`}>
              Copyright © {new Date().getFullYear()} Apna Online-Clipboard by <strong><a className="text-decoration-none" href="https://gyasu-portfolio.netlify.app/" target="_blank">Gyasuddin Ansari</a></strong>. All rights reserved.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;