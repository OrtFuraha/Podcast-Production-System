const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'John Producer', email: 'john@example.com', role: 'producer' },
      { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'host' }
    ]
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.id),
      name: 'John Producer',
      email: 'john@example.com',
      role: 'producer',
      bio: 'Passionate podcast producer',
      socialLinks: {
        twitter: '@johnproducer',
        linkedin: 'john-producer'
      }
    }
  });
});

module.exports = router;
