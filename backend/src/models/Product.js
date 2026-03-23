const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  genericName: {
    type: String,
    trim: true,
    index: true
  },
  brandName: {
    type: String,
    trim: true,
    index: true
  },
  saltComposition: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other']
  },
  subcategory: String,
  hsnCode: {
    type: String,
    required: [true, 'HSN code is required'],
    trim: true
  },
  gstPercentage: {
    type: Number,
    required: [true, 'GST percentage is required'],
    enum: [0, 5, 12, 18, 28]
  },
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'strip', 'bottle', 'vial', 'tube', 'box', 'packet']
  },
  packSize: {
    type: Number,
    default: 1
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  scheduleType: {
    type: String,
    enum: ['H', 'H1', 'X', 'G', 'none'],
    default: 'none'
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: String,
  sideEffects: String,
  dosage: String,
  storage: String,
  status: {
    type: String,
    enum: ['active', 'discontinued', 'inactive'],
    default: 'active'
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for search optimization
productSchema.index({ name: 'text', genericName: 'text', brandName: 'text', saltComposition: 'text' });
productSchema.index({ storeId: 1, status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ barcode: 1 });

module.exports = mongoose.model('Product', productSchema);
