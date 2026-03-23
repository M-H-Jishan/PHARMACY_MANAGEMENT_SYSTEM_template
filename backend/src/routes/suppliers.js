const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Supplier = require('../models/Supplier');

router.get('/', protect, async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = { storeId: req.user.storeId };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }, { gstin: { $regex: search, $options: 'i' } }];
    if (status) query.status = status;
    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, storeId: req.user.storeId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    res.json({ success: true, message: 'Supplier deactivated' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
