const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const getDb = (req) => req.app.locals.db;

function parseSocialLinks(value) {
  if (!value) return {};
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return {};
  }
}

router.get("/", (req, res) => {
  const db = getDb(req);
  db.all(
    "SELECT id, email, name, role, bio, avatar_url, social_links FROM users ORDER BY name ASC",
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      const data = rows.map((row) => ({
        ...row,
        social_links: parseSocialLinks(row.social_links),
      }));
      res.json({ success: true, data });
    },
  );
});

router.get("/me", (req, res) => {
  const db = getDb(req);
  const userId = req.query.userId || req.body.userId || 1;
  db.get(
    "SELECT id, email, name, role, bio, avatar_url, social_links FROM users WHERE id = ?",
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (!row) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({
        success: true,
        data: { ...row, social_links: parseSocialLinks(row.social_links) },
      });
    },
  );
});

router.put(
  "/me",
  [
    body("name").optional().notEmpty(),
    body("email").optional().isEmail(),
    body("bio").optional(),
    body("avatar_url").optional().isString(),
    body("social_links").optional(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const db = getDb(req);
    const userId = req.query.userId || req.body.userId || 1;
    const { name, email, bio, avatar_url, social_links } = req.body;
    const socialLinksJson =
      social_links && typeof social_links !== "string"
        ? JSON.stringify(social_links)
        : social_links;

    db.run(
      `UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      bio = COALESCE(?, bio),
      avatar_url = COALESCE(?, avatar_url),
      social_links = COALESCE(?, social_links),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
      [name, email, bio, avatar_url, socialLinksJson, userId],
      function (err) {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        db.get(
          "SELECT id, email, name, role, bio, avatar_url, social_links FROM users WHERE id = ?",
          [userId],
          (err, row) => {
            if (err) {
              return res
                .status(500)
                .json({ success: false, message: err.message });
            }
            res.json({
              success: true,
              data: {
                ...row,
                social_links: parseSocialLinks(row.social_links),
              },
            });
          },
        );
      },
    );
  },
);

router.get("/:id", (req, res) => {
  const db = getDb(req);
  db.get(
    "SELECT id, email, name, role, bio, avatar_url, social_links FROM users WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (!row) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({
        success: true,
        data: { ...row, social_links: parseSocialLinks(row.social_links) },
      });
    },
  );
});

module.exports = router;
