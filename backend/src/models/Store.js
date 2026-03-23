const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Store code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    email: String,
    landline: String
  },
  gstin: {
    type: String,
    required: [true, 'GSTIN is required'],
    unique: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format']
  },
  drugLicense: {
    number: {
      type: String,
      required: [true, 'Drug license number is required']
    },
    expiryDate: Date,
    authority: String
  },
  timings: {
    openTime: String,
    closeTime: String,
    workingDays: [String]
  },
  printerSettings: {
    invoicePrinter: {
      name: String,
      type: { type: String, enum: ['thermal', 'laser', 'inkjet'] },
      paperSize: String
    },
    labelPrinter: {
      name: String,
      type: { type: String, enum: ['thermal', 'laser'] },
      labelSize: String
    }
  },
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    lowStockThreshold: { type: Number, default: 10 },
    nearExpiryDays: { type: Number, default: 90 },
    allowNegativeStock: { type: Boolean, default: false },
    autoStockDeduction: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  parentStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  isHeadOffice: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
storeSchema.index({ code: 1 });
storeSchema.index({ gstin: 1 });
storeSchema.index({ status: 1 });

module.exports = mongoose.model('Store', storeSchema);
