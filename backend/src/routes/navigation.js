const express = require('express');
const router = express.Router();
const Navigation = require('../models/Navigation');
const { protect, authorize } = require('../middleware/auth');

const DEFAULT_MAIN_NAV = {
  name: 'main',
  items: [
    { label: 'Dashboard', href: '/', type: 'internal', icon: 'LayoutDashboard', order: 0, roles: [], isVisible: true, children: [] },
    { label: 'POS Billing', href: '/pos', type: 'internal', icon: 'ShoppingCart', order: 1, roles: [], isVisible: true, children: [] },
    { label: 'Products', href: '/products', type: 'internal', icon: 'Package', order: 2, roles: [], isVisible: true, children: [] },
    { label: 'Inventory', href: '/inventory', type: 'internal', icon: 'Warehouse', order: 3, roles: [], isVisible: true, children: [] },
    { label: 'Suppliers', href: '/suppliers', type: 'internal', icon: 'Truck', order: 4, roles: [], isVisible: true, children: [] },
    { label: 'Reports', href: '/reports', type: 'internal', icon: 'BarChart3', order: 5, roles: [], isVisible: true, children: [] },
    { label: 'Users', href: '/users', type: 'internal', icon: 'Users', order: 6, roles: ['admin', 'manager'], isVisible: true, children: [] },
  ]
};

// Public: get navigation by name
router.get('/:name', async (req, res) => {
  try {
    let nav = await Navigation.findOne({ name: req.params.name });
    if (!nav) {
      if (req.params.name === 'main') {
        nav = await Navigation.create(DEFAULT_MAIN_NAV);
      } else {
        return res.json({ nav: { name: req.params.name, items: [] } });
      }
    }
    res.json({ nav });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected: update navigation
router.put('/:name', protect, authorize('admin'), async (req, res) => {
  try {
    const nav = await Navigation.findOneAndUpdate(
      { name: req.params.name },
      { items: req.body.items, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ nav, message: 'Navigation updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected: reset navigation to defaults
router.post('/:name/reset', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.params.name !== 'main') return res.status(400).json({ message: 'Only main navigation can be reset' });
    const nav = await Navigation.findOneAndUpdate(
      { name: 'main' },
      { items: DEFAULT_MAIN_NAV.items, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ nav, message: 'Navigation reset to defaults' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
