const express = require('express');
const router = express.Router();

let subscriptions = [];

router.get('/user/:userId', (req, res) => {
  const userSubs = subscriptions.filter(s => s.userId === parseInt(req.params.userId));
  res.json({ success: true, data: userSubs });
});

router.post('/', (req, res) => {
  const { userId, podcastId } = req.body;
  const existing = subscriptions.find(s => s.userId === userId && s.podcastId === podcastId);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Already subscribed' });
  }
  
  const subscription = {
    id: subscriptions.length + 1,
    userId,
    podcastId,
    subscribedAt: new Date().toISOString()
  };
  subscriptions.push(subscription);
  res.status(201).json({ success: true, data: subscription });
});

router.delete('/:id', (req, res) => {
  const index = subscriptions.findIndex(s => s.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Subscription not found' });
  }
  subscriptions.splice(index, 1);
  res.json({ success: true, message: 'Unsubscribed successfully' });
});

module.exports = router;
