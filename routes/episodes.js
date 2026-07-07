const express = require('express');
const router = express.Router();

// Mock episode data
let episodes = [
  {
    id: 1,
    podcastId: 1,
    title: 'The Future of AI',
    description: 'Exploring artificial intelligence and its impact on society.',
    duration: '45:30',
    audioUrl: '/uploads/audio/episode1.mp3',
    videoUrl: '/uploads/video/episode1.mp4',
    thumbnail: 'https://via.placeholder.com/400x160/000000/C1121F?text=AI+Future',
    status: 'published',
    views: 1250,
    downloads: 340,
    publishedAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 2,
    podcastId: 2,
    title: 'Investment Strategies 2026',
    description: 'Top investment strategies for the coming year.',
    duration: '32:15',
    audioUrl: '/uploads/audio/episode2.mp3',
    videoUrl: '/uploads/video/episode2.mp4',
    thumbnail: 'https://via.placeholder.com/400x160/000000/C1121F?text=Investments',
    status: 'scheduled',
    views: 0,
    downloads: 0,
    publishedAt: '2026-01-20T14:00:00.000Z'
  },
  {
    id: 3,
    podcastId: 3,
    title: 'Mindfulness Meditation',
    description: 'A guided meditation for mindfulness and stress relief.',
    duration: '28:40',
    audioUrl: '/uploads/audio/episode3.mp3',
    videoUrl: '/uploads/video/episode3.mp4',
    thumbnail: 'https://via.placeholder.com/400x160/000000/C1121F?text=Meditation',
    status: 'published',
    views: 890,
    downloads: 220,
    publishedAt: '2026-01-13T08:00:00.000Z'
  }
];

// Get all episodes
router.get('/', (req, res) => {
  const { podcastId } = req.query;
  let result = episodes;
  if (podcastId) {
    result = result.filter(e => e.podcastId === parseInt(podcastId));
  }
  res.json({ success: true, data: result });
});

// Get single episode
router.get('/:id', (req, res) => {
  const episode = episodes.find(e => e.id === parseInt(req.params.id));
  if (!episode) {
    return res.status(404).json({ success: false, message: 'Episode not found' });
  }
  res.json({ success: true, data: episode });
});

// Create episode
router.post('/', (req, res) => {
  const { podcastId, title, description, duration, audioUrl, videoUrl, thumbnail, status } = req.body;
  const newEpisode = {
    id: episodes.length + 1,
    podcastId: parseInt(podcastId),
    title,
    description: description || '',
    duration: duration || '00:00',
    audioUrl: audioUrl || '/uploads/audio/default.mp3',
    videoUrl: videoUrl || '/uploads/video/default.mp4',
    thumbnail: thumbnail || 'https://via.placeholder.com/400x160/000000/C1121F?text=Episode',
    status: status || 'draft',
    views: 0,
    downloads: 0,
    publishedAt: status === 'published' ? new Date().toISOString() : null
  };
  
  episodes.push(newEpisode);
  res.status(201).json({ success: true, data: newEpisode });
});

// Update episode
router.put('/:id', (req, res) => {
  const index = episodes.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Episode not found' });
  }
  
  episodes[index] = { ...episodes[index], ...req.body };
  res.json({ success: true, data: episodes[index] });
});

// Delete episode
router.delete('/:id', (req, res) => {
  const index = episodes.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Episode not found' });
  }
  
  episodes.splice(index, 1);
  res.json({ success: true, message: 'Episode deleted' });
});

module.exports = router;
