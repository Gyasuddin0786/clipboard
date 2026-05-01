const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static("uploads"));

// Storage configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, uuidv4() + "_" + file.originalname);
  },
});

// File filter — accept images, documents, archives
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip", "application/x-zip-compressed",
    "application/x-rar-compressed", "application/vnd.rar",
    "application/x-7z-compressed", "application/octet-stream",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type: " + file.mimetype), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});

let clipboardDB = {};

// Upload route
app.post("/upload", (req, res) => {
  upload.array("files")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (file too large, etc.)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Max size is 50MB per file." });
      }
      return res.status(400).json({ error: "Upload error: " + err.message });
    } else if (err) {
      // Custom fileFilter errors
      return res.status(400).json({ error: err.message });
    }

    const { text } = req.body;
    const files = req.files || [];

    // Must have either text or files
    if (!text && files.length === 0) {
      return res.status(400).json({ error: "No content provided." });
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString();

    clipboardDB[code] = {
      text: text || null,
      files: files.map((f) => ({
        name: f.originalname,
        path: f.path,
        url: `https://clipboard-1q6x.onrender.com/${f.path}`,
        mimetype: f.mimetype,
        size: f.size,
      })),
      createdAt: new Date(),
    };

    res.json({ code });
  });
});

// Fetch by code
app.get("/clipboard/:code", (req, res) => {
  const { code } = req.params;
  const data = clipboardDB[code];
  if (!data) return res.status(404).json({ error: "Code not found or expired." });
  res.json(data);
});

// Auto-delete expired codes (older than 10 minutes)
setInterval(() => {
  const now = new Date();
  Object.keys(clipboardDB).forEach((code) => {
    const data = clipboardDB[code];
    const age = now - new Date(data.createdAt);
    if (age > 10 * 60 * 1000) {
      // Also delete uploaded files from disk
      data.files.forEach((f) => {
        fs.unlink(f.path, () => {});
      });
      delete clipboardDB[code];
    }
  });
}, 60 * 1000); // every minute

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
