const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

// GET /api/products - Get all products with batch info
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query;
    const query = { storeId: req.user.storeId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { barcode: search }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;
    else query.status = { $ne: 'inactive' };

    const products = await Product.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Attach batch summary to each product
    const productIds = products.map(p => p._id);
    const batchAgg = await Batch.aggregate([
      { $match: { productId: { $in: productIds } } },
      { $group: { _id: '$productId', totalStock: { $sum: '$quantity' }, batchCount: { $sum: 1 }, nearestExpiry: { $min: '$expiryDate' } } }
    ]);
    const batchMap = {};
    batchAgg.forEach(b => { batchMap[b._id.toString()] = b; });

    const result = products.map(p => {
      const pObj = p.toObject();
      const bInfo = batchMap[p._id.toString()] || { totalStock: 0, batchCount: 0, nearestExpiry: null };
      pObj.totalStock = bInfo.totalStock;
      pObj.batchCount = bInfo.batchCount;
      pObj.nearestExpiry = bInfo.nearestExpiry;
      return pObj;
    });

    const total = await Product.countDocuments(query);
    res.json({ success: true, data: result, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/search - Quick search for POS
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const products = await Product.find({
      storeId: req.user.storeId,
      status: 'active',
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { brandName: { $regex: q, $options: 'i' } },
        { saltComposition: { $regex: q, $options: 'i' } },
        { barcode: q }
      ]
    }).limit(20);

    // Attach active batches
    const result = [];
    for (const prod of products) {
      const batches = await Batch.find({ productId: prod._id, status: 'active', quantity: { $gt: 0 }, expiryDate: { $gt: new Date() } }).sort({ expiryDate: 1 });
      const pObj = prod.toObject();
      pObj.batches = batches;
      pObj.totalStock = batches.reduce((s, b) => s + b.quantity, 0);
      result.push(pObj);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const batches = await Batch.find({ productId: product._id }).sort({ expiryDate: 1 });
    const pObj = product.toObject();
    pObj.batches = batches;
    res.json({ success: true, data: pObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, storeId: req.user.storeId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
