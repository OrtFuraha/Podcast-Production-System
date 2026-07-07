const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Get database
const getDb = (req) => req.app.locals.db;

// Get all podcasts
router.get('/', (req, res) => {
  const db = getDb(req);
  db.all('SELECT * FROM podcasts ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, data: rows });
  });
});

// Get single podcast
router.get('/:id', (req, res) => {
  const db = getDb(req);
  db.get('SELECT * FROM podcasts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: 'Podcast not found' });
    }
    res.json({ success: true, data: row });
  });
});

// Create podcast
router.post('/', [
  body('title').notEmpty(),
  body('category').notEmpty(),
  body('host').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const db = getDb(req);
  const { title, description, category, host, cover_image } = req.body;
  
  db.run(
    'INSERT INTO podcasts (title, description, category, host, cover_image) VALUES (?, ?, ?, ?, ?)',
    [title, description || '', category, host, cover_image || 'https://via.placeholder.com/400x160/000000/C1121F?text=Podcast'],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      
      db.get('SELECT * FROM podcasts WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        res.status(201).json({ success: true, data: row });
      });
    }
  );
});

// Update podcast
router.put('/:id', (req, res) => {
  const db = getDb(req);
  const { title, description, category, host, cover_image, status, is_featured, is_trending } = req.body;
  
  db.run(
    `UPDATE podcasts SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      host = COALESCE(?, host),
      cover_image = COALESCE(?, cover_image),
      status = COALESCE(?, status),
      is_featured = COALESCE(?, is_featured),
      is_trending = COALESCE(?, is_trending),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [title, description, category, host, cover_image, status, is_featured, is_trending, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Podcast not found' });
      }
      
      db.get('SELECT * FROM podcasts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: row });
      });
    }
  );
});

// Delete podcast
router.delete('/:id', (req, res) => {
  const db = getDb(req);
  db.run('DELETE FROM podcasts WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Podcast not found' });
    }
    res.json({ success: true, message: 'Podcast deleted' });
  });
});

// Search podcasts
router.get('/search', (req, res) => {
  const { q } = req.query;
  const db = getDb(req);
  
  if (!q) {
    return db.all('SELECT * FROM podcasts', (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: rows });
    });
  }
  
  db.all(
    `SELECT * FROM podcasts WHERE 
      title LIKE ? OR 
      description LIKE ? OR 
      category LIKE ? OR 
      host LIKE ?`,
    [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: rows });
    }
  );
});

module.exports = router;
