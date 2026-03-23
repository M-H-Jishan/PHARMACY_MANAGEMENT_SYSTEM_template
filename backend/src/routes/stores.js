const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  res.json({ message: 'Get all stores - To be implemented' });
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  res.json({ message: 'Create store - To be implemented' });
});

module.exports = router;
