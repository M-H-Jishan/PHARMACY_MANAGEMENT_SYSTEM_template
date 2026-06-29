const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const { protect, authorize } = require('../middleware/auth');

// Public: get all published pages (for CMS nav & dynamic routing)
router.get('/public', async (req, res) => {
  try {
    const pages = await Page.find({ isPublished: true, pageType: 'cms' })
      .select('title slug navLabel navOrder showInNav parentNavSlug template')
      .sort({ navOrder: 1 });
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: get single published page by slug
router.get('/public/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug, isPublished: true });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json({ page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected routes
router.use(protect);

// Get all pages (admin/manager)
router.get('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const pages = await Page.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single page by ID
router.get('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json({ page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create page
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const page = new Page({ ...req.body, createdBy: req.user._id, updatedBy: req.user._id });
    await page.save();
    res.status(201).json({ page, message: 'Page created successfully' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A page with this slug already exists' });
    res.status(500).json({ message: err.message });
  }
});

// Update page
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json({ page, message: 'Page updated successfully' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A page with this slug already exists' });
    res.status(500).json({ message: err.message });
  }
});

// Toggle publish/unpublish
router.patch('/:id/publish', authorize('admin'), async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { isPublished: req.body.isPublished, updatedBy: req.user._id },
      { new: true }
    );
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json({ page, message: `Page ${page.isPublished ? 'published' : 'unpublished'} successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete page
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json({ message: 'Page deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
