const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  productName: String,
  batchNumber: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  mrp: Number,
  sellingPrice: Number,
  discount: {
    type: Number,
    default: 0
  },
  gstPercentage: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  lineTotal: Number
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    required: true
  },
  cgstAmount: Number,
  sgstAmount: Number,
  igstAmount: Number,
  grandTotal: {
    type: Number,
    required: true
  },
  roundOff: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'card', 'upi', 'credit', 'split'],
    required: true
  },
  paymentDetails: {
    cash: Number,
    card: Number,
    upi: Number,
    credit: Number,
    transactionId: String
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  prescriptionNumber: String,
  doctorName: String,
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'returned', 'pending'],
    default: 'completed'
  },
  billedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  returnReason: String,
  printCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-increment invoice number
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments({ storeId: this.storeId });
    const storeCode = 'PH'; // You can fetch from store
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.invoiceNumber = `${storeCode}${year}${month}${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ storeId: 1, createdAt: -1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ billedBy: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
