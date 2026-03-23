const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Supplier code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  gstin: {
    type: String,
    required: [true, 'GSTIN is required'],
    unique: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format']
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    email: String,
    contactPerson: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branch: String
  },
  creditDays: {
    type: Number,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  drugLicense: {
    number: String,
    expiryDate: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  notes: String,
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

// Indexes
supplierSchema.index({ code: 1 });
supplierSchema.index({ gstin: 1 });
supplierSchema.index({ storeId: 1, status: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
