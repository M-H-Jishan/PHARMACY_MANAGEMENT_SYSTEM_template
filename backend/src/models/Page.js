const mongoose = require('mongoose');

const ContentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['hero', 'text', 'features', 'image', 'gallery', 'stats', 'faq', 'team', 'testimonials', 'contact', 'custom_html', 'divider', 'cta'],
    required: true
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true }
}, { _id: true });

const PageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  content: [ContentBlockSchema],
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  isPublished: { type: Boolean, default: false },
  showInNav: { type: Boolean, default: false },
  navLabel: { type: String, trim: true },
  navOrder: { type: Number, default: 0 },
  parentNavSlug: { type: String, default: '' },
  pageType: { type: String, enum: ['cms', 'system'], default: 'cms' },
  template: { type: String, enum: ['default', 'full-width', 'centered'], default: 'default' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Page', PageSchema);
