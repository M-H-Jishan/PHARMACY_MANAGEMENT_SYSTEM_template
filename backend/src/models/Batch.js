const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    uppercase: true
  },
  manufactureDate: {
    type: Date,
    required: [true, 'Manufacture date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  gstPercentage: {
    type: Number,
    required: [true, 'GST percentage is required'],
    enum: [0, 5, 12, 18, 28]
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  rackLocation: {
    rack: String,
    shelf: String,
    bin: String
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  grnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GRN'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'damaged', 'returned', 'sold-out'],
    default: 'active'
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for days until expiry
batchSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for isExpired
batchSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.expiryDate);
});

// Virtual for isNearExpiry (90 days)
batchSchema.virtual('isNearExpiry').get(function() {
  const daysUntilExpiry = this.daysUntilExpiry;
  return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
});

// Virtual for profit margin
batchSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice * 100).toFixed(2);
});

// Indexes
batchSchema.index({ productId: 1, batchNumber: 1, storeId: 1 }, { unique: true });
batchSchema.index({ expiryDate: 1 });
batchSchema.index({ storeId: 1, status: 1 });
batchSchema.index({ barcode: 1 });

// Ensure virtuals are included in JSON
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Batch', batchSchema);
