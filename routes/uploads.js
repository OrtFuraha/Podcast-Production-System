const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = "./uploads/";
    if (file.mimetype.startsWith("image/")) dir += "images/";
    else if (file.mimetype.startsWith("video/")) dir += "video/";
    else if (file.mimetype.startsWith("audio/")) dir += "audio/";
    else dir += "other/";
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 52428800 }, // 50MB
});

router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image uploaded" });
  }
  const filePath = req.file.path.split(path.sep).join("/");
  res.json({
    success: true,
    data: {
      url: "/" + filePath,
      filename: req.file.filename,
    },
  });
});

router.post("/audio", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No audio uploaded" });
  }
  res.json({
    success: true,
    data: {
      url: "/" + req.file.path,
      filename: req.file.filename,
    },
  });
});

router.post("/video", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No video uploaded" });
  }
  res.json({
    success: true,
    data: {
      url: "/" + req.file.path,
      filename: req.file.filename,
    },
  });
});

module.exports = router;
