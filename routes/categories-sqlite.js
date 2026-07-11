const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const getDb = (req) => req.app.locals.db;

// Get all categories with podcast counts
router.get("/", (req, res) => {
  const db = getDb(req);
  db.all(
    `SELECT c.id, c.name, c.description, c.icon, COUNT(p.id) AS podcast_count
     FROM categories c
     LEFT JOIN podcasts p ON p.category = c.name
     GROUP BY c.id
     ORDER BY c.name ASC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: rows });
    },
  );
});

router.get("/:id", (req, res) => {
  const db = getDb(req);
  db.get(
    "SELECT * FROM categories WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (!row) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, data: row });
    },
  );
});

router.post(
  "/",
  [
    body("name").notEmpty(),
    body("description").optional(),
    body("icon").optional(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const db = getDb(req);
    const { name, description, icon } = req.body;
    db.run(
      "INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)",
      [name, description || "", icon || "fa-folder"],
      function (err) {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        db.get(
          "SELECT * FROM categories WHERE id = ?",
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
  },
);

router.put(
  "/:id",
  [
    body("name").optional().notEmpty(),
    body("description").optional(),
    body("icon").optional(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const db = getDb(req);
    const { name, description, icon } = req.body;
    db.run(
      `UPDATE categories SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         icon = COALESCE(?, icon)
       WHERE id = ?`,
      [name, description, icon, req.params.id],
      function (err) {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Category not found" });
        }
        db.get(
          "SELECT * FROM categories WHERE id = ?",
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
  },
);

router.delete("/:id", (req, res) => {
  const db = getDb(req);
  db.run(
    "DELETE FROM categories WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, message: "Category deleted" });
    },
  );
});

module.exports = router;
