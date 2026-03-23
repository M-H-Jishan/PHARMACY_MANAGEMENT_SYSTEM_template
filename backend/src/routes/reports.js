const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

// GET /api/reports/dashboard - Main dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const sid = req.user.storeId;
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);

    const todayInvoices = await Invoice.find({ storeId: sid, status: 'completed', createdAt: { $gte: today } });
    const weekInvoices = await Invoice.find({ storeId: sid, status: 'completed', createdAt: { $gte: weekAgo } });
    const monthInvoices = await Invoice.find({ storeId: sid, status: 'completed', createdAt: { $gte: monthAgo } });

    const todayRevenue = todayInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const weekRevenue = weekInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const monthRevenue = monthInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const todayTax = todayInvoices.reduce((s, i) => s + i.totalTax, 0);

    const totalProducts = await Product.countDocuments({ storeId: sid, status: 'active' });
    const now = new Date();
    const near = new Date(); near.setDate(near.getDate() + 90);
    const lowStock = await Batch.countDocuments({ storeId: sid, status: 'active', $expr: { $lte: ['$quantity', '$minStockLevel'] } });
    const expiredCount = await Batch.countDocuments({ storeId: sid, expiryDate: { $lt: now } });
    const nearExpiryCount = await Batch.countDocuments({ storeId: sid, expiryDate: { $gt: now, $lt: near } });

    // Recent invoices
    const recentInvoices = await Invoice.find({ storeId: sid }).populate('billedBy', 'name').sort({ createdAt: -1 }).limit(10);

    // Top selling products this month
    const topProducts = await Invoice.aggregate([
      { $match: { storeId: sid, status: 'completed', createdAt: { $gte: monthAgo } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.lineTotal' } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Daily sales for last 7 days
    const dailySales = [];
    for (let d = 6; d >= 0; d--) {
      const start = new Date(today); start.setDate(start.getDate() - d);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const dayInv = await Invoice.find({ storeId: sid, status: 'completed', createdAt: { $gte: start, $lt: end } });
      dailySales.push({ date: start.toISOString().split('T')[0], revenue: Math.round(dayInv.reduce((s, i) => s + i.grandTotal, 0)), orders: dayInv.length });
    }

    // Payment mode breakdown today
    const paymentBreakdown = {};
    todayInvoices.forEach(inv => {
      paymentBreakdown[inv.paymentMode] = (paymentBreakdown[inv.paymentMode] || 0) + inv.grandTotal;
    });

    res.json({ success: true, data: {
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayOrders: todayInvoices.length,
      todayTax: Math.round(todayTax * 100) / 100,
      weekRevenue: Math.round(weekRevenue * 100) / 100,
      weekOrders: weekInvoices.length,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      monthOrders: monthInvoices.length,
      totalProducts, lowStock, expiredCount, nearExpiryCount,
      recentInvoices, topProducts, dailySales, paymentBreakdown
    }});
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/reports/sales
router.get('/sales', protect, async (req, res) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;
    const query = { storeId: req.user.storeId, status: 'completed' };
    if (from) query.createdAt = { ...query.createdAt, $gte: new Date(from) };
    if (to) { const d = new Date(to); d.setHours(23,59,59); query.createdAt = { ...query.createdAt, $lte: d }; }

    const invoices = await Invoice.find(query).populate('billedBy', 'name').sort({ createdAt: -1 });
    const totalRevenue = invoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalTax = invoices.reduce((s, i) => s + i.totalTax, 0);
    const totalDiscount = invoices.reduce((s, i) => s + i.totalDiscount, 0);

    res.json({ success: true, data: { invoices, summary: { totalRevenue: Math.round(totalRevenue*100)/100, totalTax: Math.round(totalTax*100)/100, totalDiscount: Math.round(totalDiscount*100)/100, totalOrders: invoices.length, avgOrderValue: invoices.length ? Math.round(totalRevenue / invoices.length * 100)/100 : 0 } } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/reports/gst
router.get('/gst', protect, async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { storeId: req.user.storeId, status: 'completed' };
    if (from) query.createdAt = { ...query.createdAt, $gte: new Date(from) };
    if (to) { const d = new Date(to); d.setHours(23,59,59); query.createdAt = { ...query.createdAt, $lte: d }; }

    const invoices = await Invoice.find(query);
    const gstBreakdown = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const rate = item.gstPercentage || 0;
        if (!gstBreakdown[rate]) gstBreakdown[rate] = { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
        const taxable = item.sellingPrice * item.quantity;
        gstBreakdown[rate].taxableAmount += taxable;
        gstBreakdown[rate].cgst += item.cgst || 0;
        gstBreakdown[rate].sgst += item.sgst || 0;
        gstBreakdown[rate].igst += item.igst || 0;
        gstBreakdown[rate].total += (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
      });
    });

    Object.keys(gstBreakdown).forEach(k => {
      Object.keys(gstBreakdown[k]).forEach(f => { gstBreakdown[k][f] = Math.round(gstBreakdown[k][f] * 100) / 100; });
    });

    const totalTax = invoices.reduce((s, i) => s + i.totalTax, 0);
    res.json({ success: true, data: { gstBreakdown, totalTax: Math.round(totalTax * 100) / 100, totalInvoices: invoices.length } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
