const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

// Mock podcast data with team member names
let podcasts = [
  {
    id: 1,
    title: "Tech Talk Daily",
    description: "Daily discussions about technology and innovation.",
    category: "Technology",
    host: "Munyampeta Fiston",
    coverImage: "https://loremflickr.com/400/160/technology,podcast",
    episodes: 45,
    subscribers: 2340,
    created_at: "2025-06-01T00:00:00.000Z",
  },
  {
    id: 2,
    title: "Business Insights",
    description: "Expert insights into business strategies and market trends.",
    category: "Business",
    host: "Dukundane Belyse",
    coverImage: "https://loremflickr.com/400/160/business,podcast",
    episodes: 28,
    subscribers: 1850,
    created_at: "2025-07-15T00:00:00.000Z",
  },
  {
    id: 3,
    title: "Health & Wellness",
    description: "Your guide to a healthier and more balanced life.",
    category: "Health",
    host: "Dushime Divine & Tuyisenge Kellia",
    coverImage: "https://loremflickr.com/400/160/health,wellness",
    episodes: 32,
    subscribers: 2100,
    created_at: "2025-08-20T00:00:00.000Z",
  },
  {
    id: 4,
    title: "Music Masters",
    description: "Exploring the world of music and performance.",
    category: "Music",
    host: "Rutaganda Morris",
    coverImage: "https://loremflickr.com/400/160/music,podcast",
    episodes: 38,
    subscribers: 1900,
    created_at: "2025-09-10T00:00:00.000Z",
  },
  {
    id: 5,
    title: "Education Now",
    description: "Transforming education through innovative approaches.",
    category: "Education",
    host: "Shenge Bienvenue Audrey & Byiringiro Olivier",
    coverImage: "https://loremflickr.com/400/160/education,podcast",
    episodes: 52,
    subscribers: 3100,
    created_at: "2025-10-05T00:00:00.000Z",
  },
  {
    id: 6,
    title: "Sports Talk",
    description: "Comprehensive coverage of sports news and analysis.",
    category: "Sports",
    host: "Furaha Herve Ortega & Ntwari Prince",
    coverImage: "https://loremflickr.com/400/160/sports,podcast",
    episodes: 41,
    subscribers: 2700,
    created_at: "2025-11-01T00:00:00.000Z",
  },
];

// Get all podcasts
router.get("/", (req, res) => {
  res.json({ success: true, data: podcasts });
});

// Get single podcast
router.get("/:id", (req, res) => {
  const podcast = podcasts.find((p) => p.id === parseInt(req.params.id));
  if (!podcast) {
    return res
      .status(404)
      .json({ success: false, message: "Podcast not found" });
  }
  res.json({ success: true, data: podcast });
});

// Create podcast
router.post(
  "/",
  [
    body("title").notEmpty(),
    body("category").notEmpty(),
    body("host").notEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, category, host, coverImage } = req.body;
    const newPodcast = {
      id: podcasts.length + 1,
      title,
      description: description || "",
      category,
      host,
      coverImage: coverImage || "https://loremflickr.com/400/160/podcast",
      episodes: 0,
      subscribers: 0,
      created_at: new Date().toISOString(),
    };

    podcasts.push(newPodcast);
    res.status(201).json({ success: true, data: newPodcast });
  },
);

// Update podcast
router.put("/:id", (req, res) => {
  const index = podcasts.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res
      .status(404)
      .json({ success: false, message: "Podcast not found" });
  }

  podcasts[index] = { ...podcasts[index], ...req.body };
  res.json({ success: true, data: podcasts[index] });
});

// Delete podcast
router.delete("/:id", (req, res) => {
  const index = podcasts.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res
      .status(404)
      .json({ success: false, message: "Podcast not found" });
  }

  podcasts.splice(index, 1);
  res.json({ success: true, message: "Podcast deleted" });
});

// Search podcasts
router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ success: true, data: podcasts });
  }

  const results = podcasts.filter(
    (p) =>
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase()) ||
      p.category.toLowerCase().includes(q.toLowerCase()) ||
      p.host.toLowerCase().includes(q.toLowerCase()),
  );

  res.json({ success: true, data: results });
});

module.exports = router;
