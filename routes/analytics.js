const express = require('express');
const router = express.Router();

// Mock analytics data
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalPodcasts: 1284,
      totalEpisodes: 3756,
      draftEpisodes: 24,
      liveSessions: 127,
      subscribers: 8942,
      downloads: 45200,
      views: 125000,
      comments: 4890,
      revenue: 28450
    }
  });
});

router.get('/charts', (req, res) => {
  res.json({
    success: true,
    data: {
      monthlyUploads: [12, 19, 15, 22, 18, 25],
      weeklyListeners: [450, 520, 480, 620, 580, 720, 850],
      downloadsAnalytics: [150, 280, 190, 350, 220, 400, 320, 450],
      publishingStats: [8, 12, 10, 15, 14, 20]
    }
  });
});

router.get('/reports', (req, res) => {
  res.json({
    success: true,
    data: {
      userReport: {
        total: 5820,
        active: 3400,
        newThisMonth: 280
      },
      episodeReport: {
        total: 3756,
        published: 3200,
        drafts: 556
      },
      downloadReport: {
        total: 45200,
        audio: 28000,
        video: 17200
      }
    }
  });
});

module.exports = router;
