const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

// GET /api/inventory/dashboard - Inventory overview stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const sid = req.user.storeId;
    const now = new Date();
    const near = new Date(); near.setDate(near.getDate() + 90);

    const totalProducts = await Product.countDocuments({ storeId: sid, status: 'active' });
    const allBatches = await Batch.find({ storeId: sid });
    const totalStock = allBatches.reduce((s, b) => s + b.quantity, 0);
    const totalValue = allBatches.reduce((s, b) => s + (b.quantity * b.purchasePrice), 0);
    const totalMRPValue = allBatches.reduce((s, b) => s + (b.quantity * b.mrp), 0);
    const expiredBatches = allBatches.filter(b => new Date(b.expiryDate) < now);
    const nearExpiryBatches = allBatches.filter(b => { const e = new Date(b.expiryDate); return e > now && e < near; });
    const lowStockBatches = allBatches.filter(b => b.quantity <= b.minStockLevel && b.status === 'active');
    const zeroStockBatches = allBatches.filter(b => b.quantity === 0 && b.status === 'active');

    const categories = await Product.aggregate([
      { $match: { storeId: sid, status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, data: {
      totalProducts, totalStock,
      totalValue: Math.round(totalValue),
      totalMRPValue: Math.round(totalMRPValue),
      expiredCount: expiredBatches.length,
      nearExpiryCount: nearExpiryBatches.length,
      lowStockCount: lowStockBatches.length,
      zeroStockCount: zeroStockBatches.length,
      categories
    }});
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/inventory - Full inventory list
router.get('/', protect, async (req, res) => {
  try {
    const { filter, search } = req.query;
    const query = { storeId: req.user.storeId };
    const now = new Date();
    const near = new Date(); near.setDate(near.getDate() + 90);

    if (filter === 'expired') query.expiryDate = { $lt: now };
    else if (filter === 'near-expiry') query.expiryDate = { $gt: now, $lt: near };
    else if (filter === 'low-stock') { query.status = 'active'; query.$expr = { $lte: ['$quantity', '$minStockLevel'] }; }
    else if (filter === 'zero-stock') { query.status = 'active'; query.quantity = 0; }

    let batches = await Batch.find(query)
      .populate('productId', 'name brandName genericName category requiresPrescription')
      .populate('supplierId', 'name code')
      .sort({ expiryDate: 1 });

    if (search) {
      const s = search.toLowerCase();
      batches = batches.filter(b => b.productId &&
        (b.productId.name?.toLowerCase().includes(s) ||
         b.productId.brandName?.toLowerCase().includes(s) ||
         b.batchNumber?.toLowerCase().includes(s)));
    }

    res.json({ success: true, data: batches });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
