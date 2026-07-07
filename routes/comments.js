const express = require('express');
const router = express.Router();

let comments = [
  {
    id: 1,
    episodeId: 1,
    userId: 1,
    userName: 'Listener01',
    content: 'Great episode! Very informative.',
    likes: 15,
    dislikes: 2,
    createdAt: '2026-01-15T12:30:00.000Z',
    replies: [
      {
        id: 101,
        userId: 2,
        userName: 'SarahHost',
        content: 'Thank you for your feedback!',
        createdAt: '2026-01-15T13:00:00.000Z'
      }
    ]
  }
];

router.get('/episode/:episodeId', (req, res) => {
  const episodeComments = comments.filter(c => c.episodeId === parseInt(req.params.episodeId));
  res.json({ success: true, data: episodeComments });
});

router.post('/', (req, res) => {
  const { episodeId, userId, content } = req.body;
  const newComment = {
    id: comments.length + 1,
    episodeId,
    userId,
    userName: 'User' + userId,
    content,
    likes: 0,
    dislikes: 0,
    createdAt: new Date().toISOString(),
    replies: []
  };
  comments.push(newComment);
  res.status(201).json({ success: true, data: newComment });
});

router.post('/:commentId/like', (req, res) => {
  const comment = comments.find(c => c.id === parseInt(req.params.commentId));
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }
  comment.likes += 1;
  res.json({ success: true, data: comment });
});

router.delete('/:commentId', (req, res) => {
  const index = comments.findIndex(c => c.id === parseInt(req.params.commentId));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }
  comments.splice(index, 1);
  res.json({ success: true, message: 'Comment deleted' });
});

module.exports = router;
