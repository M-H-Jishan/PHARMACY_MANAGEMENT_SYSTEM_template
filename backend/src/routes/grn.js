const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  res.json({ message: 'Get GRNs - To be implemented' });
});

router.post('/', protect, async (req, res) => {
  res.json({ message: 'Create GRN - To be implemented' });
});

module.exports = router;
