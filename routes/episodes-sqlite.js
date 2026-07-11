const express = require("express");
const router = express.Router();

const getDb = (req) => req.app.locals.db;

// Get all episodes
router.get("/", (req, res) => {
  const { podcastId } = req.query;
  const db = getDb(req);

  let query = "SELECT * FROM episodes";
  let params = [];

  if (podcastId) {
    query += " WHERE podcast_id = ?";
    params.push(podcastId);
  }

  query += " ORDER BY created_at DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, data: rows });
  });
});

// Get single episode
router.get("/:id", (req, res) => {
  const db = getDb(req);
  db.get("SELECT * FROM episodes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Episode not found" });
    }

    // Increment view count
    db.run("UPDATE episodes SET views = views + 1 WHERE id = ?", [
      req.params.id,
    ]);

    res.json({ success: true, data: row });
  });
});

// Create episode
router.post("/", (req, res) => {
  const db = getDb(req);
  const {
    podcast_id,
    title,
    description,
    duration,
    audio_url,
    video_url,
    thumbnail,
    status,
    visibility,
  } = req.body;

  db.run(
    `INSERT INTO episodes 
      (podcast_id, title, description, duration, audio_url, video_url, thumbnail, status, visibility) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      podcast_id,
      title,
      description || "",
      duration || "00:00",
      audio_url || "/uploads/audio/default.mp3",
      video_url || "/uploads/video/default.mp4",
      thumbnail || "https://loremflickr.com/400/160/podcast,episode",
      status || "draft",
      visibility || "public",
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      db.get(
        "SELECT * FROM episodes WHERE id = ?",
        [this.lastID],
        (err, row) => {
          if (err) {
            return res
              .status(500)
              .json({ success: false, message: err.message });
          }
          res.status(201).json({ success: true, data: row });
        },
      );
    },
  );
});

// Update episode
router.put("/:id", (req, res) => {
  const db = getDb(req);
  const updates = req.body;
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== "id" && key !== "created_at") {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No fields to update" });
  }

  values.push(req.params.id);
  fields.push("updated_at = CURRENT_TIMESTAMP");

  db.run(
    `UPDATE episodes SET ${fields.join(", ")} WHERE id = ?`,
    values,
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Episode not found" });
      }

      db.get(
        "SELECT * FROM episodes WHERE id = ?",
        [req.params.id],
        (err, row) => {
          if (err) {
            return res
              .status(500)
              .json({ success: false, message: err.message });
          }
          res.json({ success: true, data: row });
        },
      );
    },
  );
});

// Delete episode
router.delete("/:id", (req, res) => {
  const db = getDb(req);
  db.run("DELETE FROM episodes WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Episode not found" });
    }
    res.json({ success: true, message: "Episode deleted" });
  });
});

module.exports = router;
