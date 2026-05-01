/* eslint-disable no-unused-vars */
import { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API_BASE_URL from "./config";
import { BsSun, BsMoon, BsClipboard2Fill } from "react-icons/bs";
import { BsLightningChargeFill, BsShieldFillCheck, BsQrCodeScan, BsCollectionFill } from "react-icons/bs";
import { BsBriefcaseFill } from "react-icons/bs";

function App() {
  const [text, setText] = useState("");
  const [textCode, setTextCode] = useState("");
  const [files, setFiles] = useState([]);
  const [fileCode, setFileCode] = useState("");
  const [images, setImages] = useState([]);
  const [imageCode, setImageCode] = useState("");
  const [fetchCode, setFetchCode] = useState("");
  const [receivedData, setReceivedData] = useState(null);
  const [errors, setErrors] = useState({ text: "", files: "", images: "", fetchCode: "" });
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedText, setCopiedText] = useState(false);
  const [loading, setLoading] = useState({ text: false, files: false, images: false, fetch: false });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [recentCodes, setRecentCodes] = useState(() => {
    const saved = localStorage.getItem("recentCodes");
    const codes = saved ? JSON.parse(saved) : [];
    const validCodes = codes.filter((item) => {
      if (typeof item === "string") return false;
      return (Date.now() - item.timestamp) / (1000 * 60) < 10;
    });
    if (validCodes.length !== codes.length) localStorage.setItem("recentCodes", JSON.stringify(validCodes));
    return validCodes;
  });
  const [uploadStats, setUploadStats] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem("uploadStats");
    const stats = saved ? JSON.parse(saved) : { date: today, count: 0 };
    return stats.date === today ? stats : { date: today, count: 0 };
  });
  const [dragActive, setDragActive] = useState({ files: false, images: false });

  const handleUpload = async (type) => {
    const formData = new FormData();
    setErrors({ text: "", files: "", images: "", fetchCode: "" });
    if (type === "text") {
      if (!text.trim()) { setErrors((p) => ({ ...p, text: "Please enter some text!" })); return; }
      formData.append("text", text);
    } else if (type === "files") {
      if (!files.length) { setErrors((p) => ({ ...p, files: "Please choose at least one file!" })); return; }
      Array.from(files).forEach((f) => formData.append("files", f));
    } else if (type === "images") {
      if (!images.length) { setErrors((p) => ({ ...p, images: "Please choose at least one image!" })); return; }
      Array.from(images).forEach((img) => formData.append("files", img));
    }
    setLoading((p) => ({ ...p, [type]: true }));
    try {
      const res = await axios.post(`${API_BASE_URL}/upload`, formData);
      const code = res.data.code;
      if (type === "text") setTextCode(code);
      else if (type === "files") setFileCode(code);
      else if (type === "images") setImageCode(code);
      const codeWithTime = { code, timestamp: Date.now() };
      const newRecentCodes = [codeWithTime, ...recentCodes.filter((c) => c.code !== code)].slice(0, 5);
      setRecentCodes(newRecentCodes);
      localStorage.setItem("recentCodes", JSON.stringify(newRecentCodes));
      const newStats = { ...uploadStats, count: uploadStats.count + 1 };
      setUploadStats(newStats);
      localStorage.setItem("uploadStats", JSON.stringify(newStats));
      toast.success("Uploaded! Code: " + code);
    } catch (err) {
      const msg = err?.response?.data?.error || "Upload failed! Please try again.";
      toast.error(msg);
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  };

  const handleFetch = async () => {
    const numericCode = fetchCode.replace(/\D/g, "");
    if (!numericCode || numericCode.length !== 5) {
      setErrors((p) => ({ ...p, fetchCode: "Please enter a valid 5-digit code!" }));
      return;
    }
    setLoading((p) => ({ ...p, fetch: true }));
    try {
      const res = await axios.get(`${API_BASE_URL}/clipboard/${fetchCode}`);
      setReceivedData(res.data);
      setErrors((p) => ({ ...p, fetchCode: "" }));
      toast.success("Data fetched successfully!");
    } catch {
      toast.error("Invalid code or data not found.");
    } finally {
      setLoading((p) => ({ ...p, fetch: false }));
    }
  };

  const isImage = (filename) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch { toast.error("Download failed!"); }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragActive((p) => ({ ...p, [type]: false }));
    const dropped = Array.from(e.dataTransfer.files);
    if (type === "files") setFiles(dropped);
    else if (type === "images") setImages(dropped);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const shareCode = (code) => {
    if (navigator.share) {
      navigator.share({ title: "Clipboard Code", text: "Access shared content: " + code, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href + "?code=" + code);
      toast.info("Link copied!");
    }
  };

  const copyToClipboard = (val, id) => {
    navigator.clipboard.writeText(val);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const dm = darkMode;

  // ---- Sub-components ----
  const CodeBadge = ({ code, type }) => (
    <div className={`mt-4 rounded-2xl p-4 border ${dm ? "bg-gray-700 border-gray-600" : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? "text-gray-400" : "text-gray-500"}`}>Your Code</p>
          <p className={`text-3xl font-black tracking-widest ${dm ? "text-green-400" : "text-green-600"}`}>{code}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => copyToClipboard(code, "code-" + code)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              copiedCode === "code-" + code
                ? "bg-green-500 text-white scale-95"
                : dm ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm"
            }`}
          >
            {copiedCode === "code-" + code ? " Copied!" : " Copy Code"}
          </button>
          <button
            onClick={() => shareCode(code)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200"
          >
             Share
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <img
          src={"https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=" + encodeURIComponent(window.location.href + "?code=" + code)}
          alt="QR"
          className="rounded-lg border border-white shadow"
          width={64}
          height={64}
        />
        <p className={`text-xs ${dm ? "text-gray-400" : "text-gray-500"}`}>Scan QR or share code.<br />Expires in 10 minutes.</p>
      </div>
    </div>
  );

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );


  return (
    <div className={`min-h-screen transition-colors duration-300 ${dm ? "bg-gray-900 text-gray-100" : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900"}`}>
      <ToastContainer theme={dm ? "dark" : "light"} position="top-right" autoClose={3000} />

      {/*  NAVBAR  */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b ${dm ? "bg-gray-900/90 border-gray-700" : "bg-white/80 border-gray-200"} shadow-sm`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md"><BsClipboard2Fill size={20} /></div>
            <div>
              <span className="font-black text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Apna Clipboard</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${dm ? "bg-blue-900 text-blue-300" : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"}`}>v1.1</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden sm:flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium ${dm ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
               Auto-delete: 10 min
            </span>
            <button
              onClick={() => { const n = !darkMode; setDarkMode(n); localStorage.setItem("darkMode", JSON.stringify(n)); }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border shadow-sm ${dm ? "bg-gray-700 hover:bg-gray-600 border-gray-600 text-yellow-300" : "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-600"}`}
              title="Toggle theme"
            >
              {dm ? <BsSun size={18} /> : <BsMoon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/*  HERO  */}
        <div className={`text-center mb-10 rounded-3xl p-8 ${dm ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200 shadow-lg"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow">
             Free &amp; No Login Required
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Apna Online Clipboard
          </h1>
          <p className={`text-lg max-w-xl mx-auto mb-6 ${dm ? "text-gray-300" : "text-gray-600"}`}>
            Share <strong>text</strong>, <strong>files</strong> &amp; <strong>images</strong> instantly via unique 5-digit codes. No login, no hassle.
          </p>
          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {[
              { icon: "", label: "Today's Uploads", val: uploadStats.count },
              { icon: "", label: "Active Codes", val: recentCodes.length },
              { icon: "", label: "Max File Size", val: "50 MB" },
            ].map((s) => (
              <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${dm ? "bg-gray-700 text-gray-200" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
                <span>{s.icon}</span>
                <span>{s.label}:</span>
                <span className="font-black">{s.val}</span>
              </div>
            ))}
          </div>
          {/* Social links */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { href: "https://github.com/Gyasuddin0786?tab=repositories", src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg", label: "GitHub" },
              { href: "https://x.com/GyasuddinA2081", src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg", label: "X" },
              { href: "https://www.linkedin.com/in/gyasuddin-ansari-199b9b2b5/", src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg", label: "LinkedIn" },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm ${dm ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50 border border-gray-200"}`}>
                {s.label === "Portfolio"
                  ? <BsBriefcaseFill size={20} className="text-indigo-500" />
                  : <img src={s.src} alt={s.label} width={22} height={22} />}
              </a>
            ))}
          </div>
          <p className={`mt-4 text-sm font-semibold ${dm ? "text-gray-400" : "text-gray-500"}`}>Developed by Gyasuddin Ansari</p>
        </div>


        {/*  RECENT CODES  */}
        {recentCodes.length > 0 && (
          <div className={`mb-8 rounded-2xl p-5 border ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${dm ? "text-gray-400" : "text-gray-500"}`}> Recent Codes</h3>
            <div className="flex flex-wrap gap-2">
              {recentCodes.map((item, idx) => {
                const minsLeft = Math.max(0, 10 - Math.floor((Date.now() - item.timestamp) / (1000 * 60)));
                return (
                  <button key={idx} onClick={() => setFetchCode(item.code)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                      dm ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600" : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    }`}
                    title={"Expires in " + minsLeft + "m"}>
                    <span className="font-black tracking-wider">{item.code}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${minsLeft <= 2 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{minsLeft}m</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/*  MAIN GRID  */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/*  TEXT UPLOAD  */}
          <div className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-md"}`}>
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 flex items-center gap-3">
              <span className="text-2xl"></span>
              <div>
                <h2 className="text-white font-bold text-lg">Text Upload</h2>
                <p className="text-cyan-100 text-xs">Share text snippets instantly</p>
              </div>
            </div>
            <div className="p-6">
              <textarea
                className={`w-full rounded-2xl border-2 p-4 text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${dm ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white"}`}
                rows={5}
                value={text}
                onChange={(e) => { setText(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, text: "" })); }}
                placeholder="Type or paste your text here..."
              />
              <div className={`flex justify-between text-xs mt-1 mb-3 ${dm ? "text-gray-500" : "text-gray-400"}`}>
                <span>{text.length} characters</span>
                <span>Max 10,000</span>
              </div>
              {errors.text && <p className="text-red-500 text-sm mb-3 flex items-center gap-1"> {errors.text}</p>}
              <button
                onClick={() => handleUpload("text")}
                disabled={loading.text}
                className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                {loading.text ? <><Spinner />Uploading...</> : "Upload Text "}
              </button>
              {textCode && <CodeBadge code={textCode} type="text" />}
            </div>
          </div>

          {/*  FILE UPLOAD  */}
          <div className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-md"}`}>
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 flex items-center gap-3">
              <span className="text-2xl"></span>
              <div>
                <h2 className="text-white font-bold text-lg">File Upload</h2>
                <p className="text-violet-100 text-xs">PDF, DOC, DOCX, TXT, ZIP — Max 50MB</p>
              </div>
            </div>
            <div className="p-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive((p) => ({ ...p, files: true })); }}
                onDragLeave={() => setDragActive((p) => ({ ...p, files: false }))}
                onDrop={(e) => handleDrop(e, "files")}
                className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
                  dragActive.files
                    ? "border-violet-500 bg-violet-50 scale-[1.01]"
                    : dm ? "border-gray-600 hover:border-violet-500 hover:bg-gray-700" : "border-gray-300 hover:border-violet-400 hover:bg-violet-50"
                }`}
              >
                <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.zip,.rar,.7z" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={(e) => { setFiles(e.target.files); if (e.target.files.length > 0) setErrors((p) => ({ ...p, files: "" })); }} />
                <div className="text-4xl mb-2"></div>
                <p className={`font-semibold text-sm ${dm ? "text-gray-300" : "text-gray-600"}`}>Drag & drop files or <span className="text-violet-500 underline">browse</span></p>
                <p className={`text-xs mt-1 ${dm ? "text-gray-500" : "text-gray-400"}`}>PDF, DOC, DOCX, TXT, ZIP, RAR (Max 50MB each)</p>
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {Array.from(files).map((f, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${dm ? "bg-gray-700" : "bg-gray-50 border border-gray-200"}`}>
                      <span className="truncate max-w-[70%] font-medium"> {f.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${dm ? "bg-gray-600 text-gray-300" : "bg-violet-100 text-violet-600"}`}>{formatFileSize(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}
              {errors.files && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"> {errors.files}</p>}
              <button
                onClick={() => handleUpload("files")}
                disabled={loading.files}
                className="w-full mt-4 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                {loading.files ? <><Spinner />Uploading...</> : "Upload Files "}
              </button>
              {fileCode && <CodeBadge code={fileCode} type="files" />}
            </div>
          </div>


          {/*  IMAGE UPLOAD  */}
          <div className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-md"}`}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center gap-3">
              <span className="text-2xl"></span>
              <div>
                <h2 className="text-white font-bold text-lg">Image Upload</h2>
                <p className="text-emerald-100 text-xs">JPG, PNG, GIF, WebP — Max 50MB</p>
              </div>
            </div>
            <div className="p-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive((p) => ({ ...p, images: true })); }}
                onDragLeave={() => setDragActive((p) => ({ ...p, images: false }))}
                onDrop={(e) => handleDrop(e, "images")}
                className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
                  dragActive.images
                    ? "border-emerald-500 bg-emerald-50 scale-[1.01]"
                    : dm ? "border-gray-600 hover:border-emerald-500 hover:bg-gray-700" : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                }`}
              >
                <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={(e) => { setImages(e.target.files); if (e.target.files.length > 0) setErrors((p) => ({ ...p, images: "" })); }} />
                <div className="text-4xl mb-2"></div>
                <p className={`font-semibold text-sm ${dm ? "text-gray-300" : "text-gray-600"}`}>Drag & drop images or <span className="text-emerald-500 underline">browse</span></p>
                <p className={`text-xs mt-1 ${dm ? "text-gray-500" : "text-gray-400"}`}>JPG, PNG, GIF, WebP (Max 50MB each)</p>
              </div>
              {images.length > 0 && (
                <div className="mt-3">
                  <p className={`text-xs font-semibold mb-2 ${dm ? "text-gray-400" : "text-gray-500"}`}>Selected Images:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from(images).map((img, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                        <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center text-xs py-0.5">{formatFileSize(img.size)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.images && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"> {errors.images}</p>}
              <button
                onClick={() => handleUpload("images")}
                disabled={loading.images}
                className="w-full mt-4 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                {loading.images ? <><Spinner />Uploading...</> : "Upload Images "}
              </button>
              {imageCode && <CodeBadge code={imageCode} type="images" />}
            </div>
          </div>

          {/*  FETCH CLIPBOARD  */}
          <div className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-md"}`}>
            <div className={`px-6 py-4 flex items-center gap-3 ${dm ? "bg-gradient-to-r from-gray-700 to-gray-600" : "bg-gradient-to-r from-slate-700 to-gray-800"}`}>
              <span className="text-2xl"></span>
              <div>
                <h2 className="text-white font-bold text-lg">Fetch Clipboard</h2>
                <p className="text-gray-300 text-xs">Enter code to retrieve shared data</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  className={`flex-1 rounded-2xl border-2 px-4 py-3 text-xl font-black tracking-[0.3em] text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 ${dm ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-500 focus:bg-white"}`}
                  placeholder="_ _ _ _ _"
                  value={fetchCode}
                  maxLength={5}
                  onChange={(e) => { setFetchCode(e.target.value.replace(/\D/g, "")); setErrors((p) => ({ ...p, fetchCode: "" })); }}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                />
                <button
                  onClick={handleFetch}
                  disabled={loading.fetch}
                  className={`px-6 py-3 rounded-2xl font-bold text-white transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${dm ? "bg-gray-600 hover:bg-gray-500" : "bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900"}`}
                >
                  {loading.fetch ? <Spinner /> : "Fetch "}
                </button>
              </div>
              {errors.fetchCode && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"> {errors.fetchCode}</p>}

              {receivedData && (
                <div className="mt-5 space-y-4">
                  {receivedData.text && (
                    <div className={`rounded-2xl border p-4 ${dm ? "bg-gray-700 border-gray-600" : "bg-blue-50 border-blue-200"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold text-sm ${dm ? "text-blue-300" : "text-blue-700"}`}> Text Content</h4>
                        <button
                          onClick={() => { navigator.clipboard.writeText(receivedData.text); setCopiedText(true); setTimeout(() => setCopiedText(false), 2000); }}
                          className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${copiedText ? "bg-green-500 text-white" : dm ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`}
                        >
                          {copiedText ? " Copied!" : " Copy"}
                        </button>
                      </div>
                      <div className={`max-h-40 overflow-y-auto text-sm whitespace-pre-wrap break-words rounded-xl p-3 ${dm ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
                        {receivedData.text}
                      </div>
                    </div>
                  )}

                  {receivedData.files && receivedData.files.length > 0 && (
                    <div>
                      <h4 className={`font-bold text-sm mb-3 ${dm ? "text-emerald-300" : "text-emerald-700"}`}> Files & Images</h4>
                      <div className="space-y-2">
                        {receivedData.files.map((file, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${dm ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                            {isImage(file.name) ? (
                              <img src={`${API_BASE_URL}/${file.path}`} alt={file.name} className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow" />
                            ) : (
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${dm ? "bg-gray-600" : "bg-gray-200"}`}></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${dm ? "text-gray-200" : "text-gray-800"}`}>{file.name}</p>
                              <p className={`text-xs ${dm ? "text-gray-400" : "text-gray-500"}`}>{isImage(file.name) ? "Image" : "Document"}</p>
                            </div>
                            <button
                              onClick={() => handleDownload(`${API_BASE_URL}/${file.path}`, file.name)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow active:scale-95"
                            >
                               Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>


        {/*  ABOUT SECTION  */}
        <div className={`mt-10 rounded-3xl border p-8 ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-md"}`}>
          <h2 className="text-2xl font-black mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> About Apna Online Clipboard</h2>
          <p className={`mb-5 ${dm ? "text-gray-300" : "text-gray-600"}`}>
            A lightweight web app to temporarily store and share text, files, and images using unique codes. No login required — just upload and share.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { icon: "", text: "Share text snippets with teammates" },
              { icon: "", text: "Quickly transfer files between devices" },
              { icon: "", text: "Upload and retrieve images without login" },
              { icon: "", text: "Auto-deleted after 10 minutes for privacy" },
            ].map((item) => (
              <div key={item.text} className={`flex items-center gap-3 p-3 rounded-2xl ${dm ? "bg-gray-700" : "bg-blue-50"}`}>
                <span>{item.icon}</span>
                <span className={`text-sm font-medium ${dm ? "text-gray-200" : "text-gray-700"}`}>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <BsLightningChargeFill size={20} />, label: "Lightning Fast", color: "from-yellow-400 to-orange-400" },
              { icon: <BsShieldFillCheck size={20} />, label: "Auto-Delete", color: "from-green-400 to-emerald-500" },
              { icon: <BsQrCodeScan size={20} />, label: "QR Codes", color: "from-blue-400 to-cyan-500" },
              { icon: <BsCollectionFill size={20} />, label: "Multi-Format", color: "from-purple-400 to-violet-500" },
            ].map((f) => (
              <div key={f.label} className={`rounded-2xl p-4 text-center ${dm ? "bg-gray-700" : "bg-gray-50 border border-gray-200"}`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mx-auto mb-2 shadow-md`}>{f.icon}</div>
                <p className={`text-xs font-bold mt-1 ${dm ? "text-gray-300" : "text-gray-700"}`}>{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/*  FOOTER  */}
        <footer className={`mt-8 rounded-3xl border p-6 text-center ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex justify-center gap-3 mb-4 flex-wrap">
            {[
              { href: "https://github.com/Gyasuddin0786?tab=repositories", src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg", label: "GitHub" },
              { href: "https://x.com/GyasuddinA2081", src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg", label: "X" },
              { href: "https://www.linkedin.com/in/gyasuddin-ansari-199b9b2b5/", src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg", label: "LinkedIn" },
              { href: "https://gyasu-portfolio.netlify.app/", src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg", label: "Portfolio" },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm ${dm ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200 border border-gray-200"}`}>
                <img src={s.src} alt={s.label} width={20} height={20} />
              </a>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Made with  in India</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Open Source</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700">Free Forever</span>
          </div>
          <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>
            Copyright  {new Date().getFullYear()}{" "}
            <a href="https://gyasu-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-500 hover:underline">
              Gyasuddin Ansari
            </a>
            . All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  );
}

export default App;
