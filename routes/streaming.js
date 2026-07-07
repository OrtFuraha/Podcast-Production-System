const express = require('express');
const router = express.Router();

router.get('/stream/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      streamUrl: `/uploads/audio/episode${req.params.id}.mp3`,
      type: 'audio/mp3'
    }
  });
});

router.get('/video/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      streamUrl: `/uploads/video/episode${req.params.id}.mp4`,
      type: 'video/mp4'
    }
  });
});

module.exports = router;
