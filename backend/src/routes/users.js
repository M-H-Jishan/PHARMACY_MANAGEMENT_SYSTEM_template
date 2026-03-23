const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const users = await User.find({ storeId: req.user.storeId }).populate('storeId', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('storeId', 'name code');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
