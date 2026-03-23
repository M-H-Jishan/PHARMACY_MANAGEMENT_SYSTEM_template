const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Batch = require('../models/Batch');

router.get('/', protect, async (req, res) => {
  try {
    const { productId, status, expiry } = req.query;
    const query = { storeId: req.user.storeId };
    if (productId) query.productId = productId;
    if (status) query.status = status;
    if (expiry === 'expired') query.expiryDate = { $lt: new Date() };
    else if (expiry === 'near') {
      const d = new Date(); d.setDate(d.getDate() + 90);
      query.expiryDate = { $gt: new Date(), $lt: d };
    }
    const batches = await Batch.find(query).populate('productId', 'name brandName category').sort({ expiryDate: 1 });
    res.json({ success: true, data: batches });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('productId').populate('supplierId', 'name code');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', protect, authorize('admin', 'manager', 'pharmacist'), async (req, res) => {
  try {
    const batch = await Batch.create({ ...req.body, storeId: req.user.storeId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: batch });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = router;
