const mongoose = require('mongoose');

const NavChildSchema = new mongoose.Schema({
  label: { type: String, required: true },
  href: { type: String, required: true },
  type: { type: String, enum: ['internal', 'external', 'cms_page'], default: 'internal' },
  icon: { type: String, default: '' },
  order: { type: Number, default: 0 },
  roles: [{ type: String }],
  isVisible: { type: Boolean, default: true },
}, { _id: true });

const NavItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  href: { type: String, required: true },
  type: { type: String, enum: ['internal', 'external', 'cms_page'], default: 'internal' },
  icon: { type: String, default: '' },
  order: { type: Number, default: 0 },
  roles: [{ type: String }],
  isVisible: { type: Boolean, default: true },
  children: [NavChildSchema],
}, { _id: true });

const NavigationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  items: [NavItemSchema],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Navigation', NavigationSchema);
