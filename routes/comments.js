const express = require("express");
const router = express.Router();

const getDb = (req) => req.app.locals.db;

// List all comments (joined with user + episode info) - used by dashboard
router.get("/", (req, res) => {
  const db = getDb(req);
  db.all(
    `SELECT c.*, u.name AS user_name, e.title AS episode_title
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN episodes e ON e.id = c.episode_id
     ORDER BY c.created_at DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: rows });
    },
  );
});

router.get("/episode/:episodeId", (req, res) => {
  const db = getDb(req);
  db.all(
    `SELECT c.*, u.name AS user_name
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.episode_id = ?
     ORDER BY c.created_at DESC`,
    [req.params.episodeId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: rows });
    },
  );
});

router.post("/", (req, res) => {
  const db = getDb(req);
  const { episodeId, userId, content, parentId } = req.body;
  if (!episodeId || !userId || !content) {
    return res.status(400).json({
      success: false,
      message: "episodeId, userId and content are required",
    });
  }

  db.run(
    "INSERT INTO comments (episode_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
    [episodeId, userId, content, parentId || null],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      db.get(
        `SELECT c.*, u.name AS user_name
         FROM comments c JOIN users u ON u.id = c.user_id
         WHERE c.id = ?`,
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

router.post("/:commentId/like", (req, res) => {
  const db = getDb(req);
  db.run(
    "UPDATE comments SET likes = likes + 1 WHERE id = ?",
    [req.params.commentId],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }
      db.get(
        "SELECT * FROM comments WHERE id = ?",
        [req.params.commentId],
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

router.post("/:commentId/pin", (req, res) => {
  const db = getDb(req);
  db.run(
    "UPDATE comments SET is_pinned = NOT is_pinned WHERE id = ?",
    [req.params.commentId],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }
      db.get(
        "SELECT * FROM comments WHERE id = ?",
        [req.params.commentId],
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

router.delete("/:commentId", (req, res) => {
  const db = getDb(req);
  db.run(
    "DELETE FROM comments WHERE id = ?",
    [req.params.commentId],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }
      res.json({ success: true, message: "Comment deleted" });
    },
  );
});

module.exports = router;
