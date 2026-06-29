const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const { protect, authorize } = require('../middleware/auth');

// Public: get site settings (needed for branding/dynamic CSS)
router.get('/', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await SiteSettings.create({ key: 'main' });
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected: update site settings
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { key, _id, __v, createdAt, ...updateData } = req.body;
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { ...updateData, key: 'main', updatedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ settings, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
