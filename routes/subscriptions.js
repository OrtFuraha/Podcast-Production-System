const express = require("express");
const router = express.Router();

const getDb = (req) => req.app.locals.db;

// List all subscriptions (joined with user + podcast info) - used by dashboard
router.get("/", (req, res) => {
  const db = getDb(req);
  db.all(
    `SELECT s.id, s.user_id, s.podcast_id, s.subscribed_at,
            u.name AS user_name, u.email AS user_email,
            p.title AS podcast_title
     FROM subscribers s
     JOIN users u ON u.id = s.user_id
     JOIN podcasts p ON p.id = s.podcast_id
     ORDER BY s.subscribed_at DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: rows });
    },
  );
});

router.get("/user/:userId", (req, res) => {
  const db = getDb(req);
  db.all(
    `SELECT s.id, s.podcast_id, s.subscribed_at, p.title AS podcast_title
     FROM subscribers s
     JOIN podcasts p ON p.id = s.podcast_id
     WHERE s.user_id = ?
     ORDER BY s.subscribed_at DESC`,
    [req.params.userId],
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
  const { userId, podcastId } = req.body;
  if (!userId || !podcastId) {
    return res
      .status(400)
      .json({ success: false, message: "userId and podcastId are required" });
  }

  db.run(
    "INSERT INTO subscribers (user_id, podcast_id) VALUES (?, ?)",
    [userId, podcastId],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res
            .status(400)
            .json({ success: false, message: "Already subscribed" });
        }
        return res.status(500).json({ success: false, message: err.message });
      }
      db.get(
        "SELECT * FROM subscribers WHERE id = ?",
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

router.delete("/:id", (req, res) => {
  const db = getDb(req);
  db.run(
    "DELETE FROM subscribers WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Subscription not found" });
      }
      res.json({ success: true, message: "Unsubscribed successfully" });
    },
  );
});

module.exports = router;
