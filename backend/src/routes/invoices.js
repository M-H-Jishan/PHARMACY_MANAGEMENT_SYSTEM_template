const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Batch = require('../models/Batch');

// GET /api/invoices
router.get('/', protect, async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 20 } = req.query;
    const query = { storeId: req.user.storeId };
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59); query.createdAt.$lte = d; }
    }
    const invoices = await Invoice.find(query)
      .populate('billedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Invoice.countDocuments(query);
    res.json({ success: true, data: invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/invoices/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('billedBy', 'name username');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/invoices - Create invoice (POS billing)
router.post('/', protect, async (req, res) => {
  try {
    const { items, paymentMode, paymentDetails, customerName, customerPhone, prescriptionNumber, doctorName } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    let subtotal = 0, totalTax = 0, totalDiscount = 0;
    const processedItems = [];

    for (const item of items) {
      const batch = await Batch.findById(item.batchId);
      if (!batch) return res.status(400).json({ message: `Batch ${item.batchId} not found` });
      if (batch.quantity < item.quantity) return res.status(400).json({ message: `Insufficient stock for batch ${batch.batchNumber}` });
      if (new Date(batch.expiryDate) < new Date()) return res.status(400).json({ message: `Batch ${batch.batchNumber} is expired` });

      const linePrice = batch.sellingPrice * item.quantity;
      const lineTax = linePrice * batch.gstPercentage / 100;
      const lineDiscount = item.discount || 0;

      processedItems.push({
        productId: item.productId, batchId: item.batchId,
        productName: item.productName, batchNumber: batch.batchNumber,
        quantity: item.quantity, mrp: batch.mrp, sellingPrice: batch.sellingPrice,
        discount: lineDiscount, gstPercentage: batch.gstPercentage,
        cgst: Math.round(lineTax / 2 * 100) / 100, sgst: Math.round(lineTax / 2 * 100) / 100, igst: 0,
        lineTotal: Math.round((linePrice + lineTax - lineDiscount) * 100) / 100
      });

      subtotal += linePrice;
      totalTax += lineTax;
      totalDiscount += lineDiscount;

      // Deduct stock
      batch.quantity -= item.quantity;
      if (batch.quantity === 0) batch.status = 'sold-out';
      await batch.save();
    }

    const grandTotal = Math.round((subtotal + totalTax - totalDiscount) * 100) / 100;

    const invoice = await Invoice.create({
      storeId: req.user.storeId, items: processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      cgstAmount: Math.round(totalTax / 2 * 100) / 100,
      sgstAmount: Math.round(totalTax / 2 * 100) / 100, igstAmount: 0,
      grandTotal, roundOff: 0,
      paymentMode: paymentMode || 'cash', paymentDetails: paymentDetails || { cash: grandTotal },
      customerName, customerPhone, prescriptionNumber, doctorName,
      billedBy: req.user._id, status: 'completed'
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/invoices/:id/cancel
router.put('/:id/cancel', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'cancelled') return res.status(400).json({ message: 'Invoice already cancelled' });

    // Restore stock
    for (const item of invoice.items) {
      await Batch.findByIdAndUpdate(item.batchId, { $inc: { quantity: item.quantity }, status: 'active' });
    }
    invoice.status = 'cancelled';
    invoice.returnReason = req.body.reason || 'Cancelled by manager';
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
