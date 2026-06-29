const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/products', require('./routes/products'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/grn', require('./routes/grn'));
app.use('/api/cms', require('./routes/cms'));
app.use('/api/navigation', require('./routes/navigation'));
app.use('/api/site-settings', require('./routes/siteSettings'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Try external MongoDB first, fallback to in-memory
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_management';
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB connected (external)');
    } catch {
      console.log('⚠️  External MongoDB unavailable, starting in-memory server...');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('✅ MongoDB connected (in-memory)');
    }

    // Seed data
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

async function seedDatabase() {
  const User = require('./models/User');
  const Store = require('./models/Store');
  const Product = require('./models/Product');
  const Batch = require('./models/Batch');
  const Supplier = require('./models/Supplier');
  const Invoice = require('./models/Invoice');

  const userCount = await User.countDocuments();
  if (userCount > 0) return; // Already seeded

  console.log('🌱 Seeding database...');

  // Create store
  const store = await Store.create({
    name: 'HealthFirst Pharmacy',
    code: 'HF001',
    address: { street: '45 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
    contact: { phone: '+91-9876543210', email: 'info@healthfirst.com', landline: '022-12345678' },
    gstin: '27AABCH1234F1ZV',
    drugLicense: { number: 'DL-MH-2024-00567', expiryDate: new Date('2027-03-31'), authority: 'FDA Maharashtra' },
    timings: { openTime: '08:00', closeTime: '22:00', workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    settings: { lowStockThreshold: 15, nearExpiryDays: 90 },
    status: 'active',
    isHeadOffice: true
  });

  // Create users
  const admin = await User.create({ username: 'admin', password: 'admin123', name: 'Rajesh Kumar', email: 'rajesh@healthfirst.com', phone: '+91-9876543210', role: 'admin', storeId: store._id, status: 'active' });
  await User.create({ username: 'manager', password: 'manager123', name: 'Priya Sharma', email: 'priya@healthfirst.com', phone: '+91-9876543211', role: 'manager', storeId: store._id, status: 'active' });
  await User.create({ username: 'pharmacist', password: 'pharmacist123', name: 'Dr. Ankit Patel', email: 'ankit@healthfirst.com', phone: '+91-9876543212', role: 'pharmacist', storeId: store._id, status: 'active' });
  await User.create({ username: 'cashier', password: 'cashier123', name: 'Neha Gupta', email: 'neha@healthfirst.com', phone: '+91-9876543213', role: 'cashier', storeId: store._id, status: 'active' });

  // Create suppliers
  const sup1 = await Supplier.create({ name: 'MedLife Distributors', code: 'SUP001', gstin: '27AABCM5678D1ZW', contact: { phone: '+91-9988776655', email: 'sales@medlife.com', contactPerson: 'Amit Shah' }, address: { street: '12 Pharma Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400010' }, creditDays: 30, creditLimit: 500000, status: 'active', storeId: store._id, createdBy: admin._id });
  const sup2 = await Supplier.create({ name: 'PharmaCare India', code: 'SUP002', gstin: '27AABCP9012E1ZX', contact: { phone: '+91-9977665544', email: 'orders@pharmacare.in', contactPerson: 'Sunil Verma' }, address: { street: '88 Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411001' }, creditDays: 45, creditLimit: 300000, status: 'active', storeId: store._id, createdBy: admin._id });
  await Supplier.create({ name: 'Global Pharma Supply', code: 'SUP003', gstin: '27AABCG3456F1ZY', contact: { phone: '+91-9966554433', email: 'supply@globalpharma.com', contactPerson: 'Rahul Mehta' }, address: { street: '56 Trade Center', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' }, creditDays: 60, creditLimit: 200000, status: 'active', storeId: store._id, createdBy: admin._id });

  // Create products with batches
  const productsData = [
    { name: 'Paracetamol 500mg', genericName: 'Paracetamol', brandName: 'Crocin', manufacturer: 'GSK', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567890' },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', brandName: 'Mox 500', manufacturer: 'Cipla', category: 'capsule', hsnCode: '30041012', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: true, scheduleType: 'H', barcode: '8901234567891' },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', brandName: 'Azithral 500', manufacturer: 'Alembic', category: 'tablet', hsnCode: '30041012', gstPercentage: 12, unit: 'strip', packSize: 3, requiresPrescription: true, scheduleType: 'H', barcode: '8901234567892' },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine', brandName: 'Cetzine', manufacturer: 'UniChem', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567893' },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', brandName: 'Omez', manufacturer: 'Dr. Reddy\'s', category: 'capsule', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567894' },
    { name: 'Metformin 500mg', genericName: 'Metformin', brandName: 'Glycomet', manufacturer: 'USV', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: true, scheduleType: 'H', barcode: '8901234567895' },
    { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', brandName: 'Atorva 10', manufacturer: 'Zydus', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: true, scheduleType: 'H', barcode: '8901234567896' },
    { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', brandName: 'Pan 40', manufacturer: 'Alkem', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567897' },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', brandName: 'Brufen 400', manufacturer: 'Abbott', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567898' },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine', brandName: 'Amlong 5', manufacturer: 'Micro Labs', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: true, scheduleType: 'H', barcode: '8901234567899' },
    { name: 'Dolo 650mg', genericName: 'Paracetamol', brandName: 'Dolo 650', manufacturer: 'Micro Labs', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 15, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567900' },
    { name: 'Cough Syrup', genericName: 'Dextromethorphan', brandName: 'Benadryl', manufacturer: 'Johnson & Johnson', category: 'syrup', hsnCode: '30049099', gstPercentage: 12, unit: 'bottle', packSize: 1, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567901' },
    { name: 'Vitamin D3 60K', genericName: 'Cholecalciferol', brandName: 'D-Rise 60K', manufacturer: 'USV', category: 'capsule', hsnCode: '30049099', gstPercentage: 5, unit: 'strip', packSize: 4, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567902' },
    { name: 'Insulin Glargine', genericName: 'Insulin Glargine', brandName: 'Lantus', manufacturer: 'Sanofi', category: 'injection', hsnCode: '30041011', gstPercentage: 5, unit: 'vial', packSize: 1, requiresPrescription: true, scheduleType: 'H', barcode: '8901234567903' },
    { name: 'Diclofenac Gel', genericName: 'Diclofenac', brandName: 'Voveran Emulgel', manufacturer: 'Novartis', category: 'ointment', hsnCode: '30049099', gstPercentage: 18, unit: 'tube', packSize: 1, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567904' },
    { name: 'Montelukast 10mg', genericName: 'Montelukast', brandName: 'Montair 10', manufacturer: 'Cipla', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: true, scheduleType: 'H', barcode: '8901234567905' },
    { name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin', brandName: 'Ciplox 500', manufacturer: 'Cipla', category: 'tablet', hsnCode: '30041012', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: true, scheduleType: 'H1', barcode: '8901234567906' },
    { name: 'ORS Powder', genericName: 'Electrolytes', brandName: 'Electral', manufacturer: 'FDC', category: 'other', hsnCode: '30049099', gstPercentage: 5, unit: 'packet', packSize: 1, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567907' },
    { name: 'B-Complex Forte', genericName: 'B-Complex Vitamins', brandName: 'Becosules', manufacturer: 'Pfizer', category: 'capsule', hsnCode: '30049099', gstPercentage: 5, unit: 'strip', packSize: 20, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567908' },
    { name: 'Ranitidine 150mg', genericName: 'Ranitidine', brandName: 'Rantac 150', manufacturer: 'J.B. Chemicals', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '8901234567909' },
  ];

  const batchTemplates = [
    { batchSuffix: 'A01', mfgOffset: -180, expOffset: 365, mrpBase: 1, ppBase: 0.6, qty: 120 },
    { batchSuffix: 'B01', mfgOffset: -90, expOffset: 540, mrpBase: 1, ppBase: 0.55, qty: 80 },
    { batchSuffix: 'C01', mfgOffset: -30, expOffset: 720, mrpBase: 1.05, ppBase: 0.58, qty: 200 },
    { batchSuffix: 'X01', mfgOffset: -400, expOffset: 30, mrpBase: 0.95, ppBase: 0.5, qty: 15 }, // near-expiry
    { batchSuffix: 'Z01', mfgOffset: -700, expOffset: -10, mrpBase: 0.9, ppBase: 0.5, qty: 5 }, // expired
  ];

  const mrps = [45, 180, 220, 35, 95, 55, 120, 85, 65, 70, 42, 140, 200, 1800, 110, 165, 190, 22, 38, 48];

  for (let i = 0; i < productsData.length; i++) {
    const pd = productsData[i];
    const product = await Product.create({ ...pd, storeId: store._id, createdBy: admin._id, status: 'active' });

    // Create 2-4 batches per product
    const numBatches = i < 5 ? 4 : (i < 10 ? 3 : 2);
    for (let j = 0; j < numBatches; j++) {
      const bt = batchTemplates[j % batchTemplates.length];
      const now = new Date();
      const mrp = mrps[i] * bt.mrpBase;
      await Batch.create({
        productId: product._id,
        batchNumber: `${pd.brandName.substring(0,3).toUpperCase()}${bt.batchSuffix}`,
        manufactureDate: new Date(now.getTime() + bt.mfgOffset * 86400000),
        expiryDate: new Date(now.getTime() + bt.expOffset * 86400000),
        mrp: Math.round(mrp * 100) / 100,
        purchasePrice: Math.round(mrp * bt.ppBase * 100) / 100,
        sellingPrice: Math.round(mrp * 100) / 100,
        gstPercentage: pd.gstPercentage,
        quantity: bt.qty + Math.floor(Math.random() * 50),
        minStockLevel: 10,
        storeId: store._id,
        supplierId: j % 2 === 0 ? sup1._id : sup2._id,
        status: bt.expOffset < 0 ? 'expired' : 'active',
        createdBy: admin._id
      });
    }
  }

  // Create some sample invoices
  const products = await Product.find({ storeId: store._id });
  const batches = await Batch.find({ storeId: store._id, status: 'active' });
  const cashier = await User.findOne({ username: 'cashier' });

  for (let d = 0; d < 7; d++) {
    const numInvoices = 3 + Math.floor(Math.random() * 5);
    for (let inv = 0; inv < numInvoices; inv++) {
      const numItems = 1 + Math.floor(Math.random() * 4);
      const items = [];
      let subtotal = 0, totalTax = 0;
      const usedBatches = new Set();

      for (let it = 0; it < numItems; it++) {
        const batch = batches[Math.floor(Math.random() * batches.length)];
        if (usedBatches.has(batch._id.toString())) continue;
        usedBatches.add(batch._id.toString());
        const prod = products.find(p => p._id.toString() === batch.productId.toString());
        if (!prod) continue;
        const qty = 1 + Math.floor(Math.random() * 3);
        const linePrice = batch.sellingPrice * qty;
        const lineTax = linePrice * batch.gstPercentage / 100;
        items.push({
          productId: prod._id, batchId: batch._id, productName: prod.name, batchNumber: batch.batchNumber,
          quantity: qty, mrp: batch.mrp, sellingPrice: batch.sellingPrice, discount: 0,
          gstPercentage: batch.gstPercentage, cgst: lineTax/2, sgst: lineTax/2, igst: 0, lineTotal: linePrice + lineTax
        });
        subtotal += linePrice;
        totalTax += lineTax;
      }
      if (items.length === 0) continue;
      const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;
      const modes = ['cash','card','upi'];
      const invoiceDate = new Date(); invoiceDate.setDate(invoiceDate.getDate() - d);
      invoiceDate.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

      await Invoice.create({
        storeId: store._id, items, subtotal: Math.round(subtotal * 100)/100,
        totalDiscount: 0, totalTax: Math.round(totalTax * 100)/100,
        cgstAmount: Math.round(totalTax/2 * 100)/100, sgstAmount: Math.round(totalTax/2 * 100)/100, igstAmount: 0,
        grandTotal, roundOff: 0, paymentMode: modes[Math.floor(Math.random() * modes.length)],
        paymentDetails: { cash: grandTotal }, status: 'completed', billedBy: cashier._id,
        customerName: ['Ramesh Patel','Sunita Devi','Arjun Singh','Meena Kumari','Vikram Shah','Lakshmi Nair','Gopal Reddy'][Math.floor(Math.random()*7)],
        customerPhone: `+91-98${Math.floor(10000000 + Math.random()*90000000)}`,
        createdAt: invoiceDate, updatedAt: invoiceDate
      });
    }
  }

  const totalProducts = await Product.countDocuments();
  const totalBatches = await Batch.countDocuments();
  const totalInvoices = await Invoice.countDocuments();
  console.log(`✅ Seeded: 4 users, 3 suppliers, ${totalProducts} products, ${totalBatches} batches, ${totalInvoices} invoices`);
}

startServer();
