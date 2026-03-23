import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Search, Plus, Minus, X, ShoppingCart, CreditCard, Smartphone,
  Banknote, Trash2, CheckCircle, AlertTriangle, Pill, Receipt
} from 'lucide-react';

export default function POS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const handleSearch = (val) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`/api/products/search?q=${encodeURIComponent(val)}`);
        setSearchResults(res.data.data || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
  };

  const addToCart = (product, batch) => {
    const key = `${product._id}_${batch._id}`;
    const existing = cart.find(i => i.key === key);
    if (existing) {
      if (existing.quantity >= batch.quantity) { toast.error('Max stock reached'); return; }
      setCart(cart.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, {
        key, productId: product._id, batchId: batch._id,
        productName: product.name, brandName: product.brandName,
        batchNumber: batch.batchNumber, expiryDate: batch.expiryDate,
        mrp: batch.mrp, sellingPrice: batch.sellingPrice,
        gstPercentage: batch.gstPercentage, maxStock: batch.quantity,
        requiresPrescription: product.requiresPrescription,
        quantity: 1
      }]);
    }
    setSearchTerm('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (key, delta) => {
    setCart(cart.map(i => {
      if (i.key !== key) return i;
      const newQty = i.quantity + delta;
      if (newQty < 1) return i;
      if (newQty > i.maxStock) { toast.error('Insufficient stock'); return i; }
      return { ...i, quantity: newQty };
    }));
  };

  const removeItem = (key) => setCart(cart.filter(i => i.key !== key));
  const clearCart = () => { setCart([]); setCompletedInvoice(null); };

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0);
  const totalGST = cart.reduce((s, i) => s + (i.sellingPrice * i.quantity * i.gstPercentage / 100), 0);
  const grandTotal = subtotal + totalGST;
  const hasPrescription = cart.some(i => i.requiresPrescription);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await axios.post('/api/invoices', {
        items: cart.map(i => ({
          productId: i.productId, batchId: i.batchId,
          productName: i.productName, quantity: i.quantity, discount: 0
        })),
        paymentMode, customerName: customerName || undefined, customerPhone: customerPhone || undefined
      });
      setCompletedInvoice(res.data.data);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Sale completed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
    setSubmitting(false);
  };

  // Invoice receipt view
  if (completedInvoice) {
    const inv = completedInvoice;
    return (
      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-lg border p-6 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Sale Complete!</h2>
          <p className="text-gray-500 text-sm mt-1">Invoice #{inv.invoiceNumber}</p>
          <div className="mt-6 text-left border rounded-xl p-4 space-y-2 text-sm">
            {inv.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.productName} × {item.quantity}</span>
                <span className="font-medium">₹{item.lineTotal?.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{inv.subtotal?.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>GST</span><span>₹{inv.totalTax?.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{inv.grandTotal?.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={clearCart} className="flex-1 btn btn-primary">New Sale</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left — Search & Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary-600" /> POS Billing
          </h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input ref={searchRef} type="text" value={searchTerm} onChange={(e) => handleSearch(e.target.value)}
            className="input pl-10 text-base" placeholder="Search medicine by name, brand, salt, or barcode..." />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" /></div>}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {searchResults.length > 0 ? searchResults.map(product => (
            <div key={product._id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
                    {product.name}
                    {product.requiresPrescription && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">RX</span>}
                  </h3>
                  <p className="text-sm text-gray-500">{product.brandName} • {product.manufacturer} • {product.category}</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Stock: {product.totalStock}</span>
              </div>
              {/* Batches */}
              <div className="space-y-1.5">
                {(product.batches || []).map(batch => {
                  const daysLeft = Math.ceil((new Date(batch.expiryDate) - new Date()) / 86400000);
                  return (
                    <div key={batch._id} onClick={() => addToCart(product, batch)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-primary-50 cursor-pointer border border-transparent hover:border-primary-200 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded">{batch.batchNumber}</span>
                        <span className={`text-xs ${daysLeft < 90 ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                          Exp: {new Date(batch.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          {daysLeft < 90 && ` (${daysLeft}d)`}
                        </span>
                        <span className="text-xs text-gray-400">Qty: {batch.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">₹{batch.sellingPrice}</span>
                        <Plus className="h-4 w-4 text-primary-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )) : searchTerm ? (
            <div className="text-center py-12 text-gray-400">
              <Pill className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>{searching ? 'Searching...' : 'No medicines found'}</p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Search for a medicine to add to cart</p>
              <p className="text-xs mt-1">Type name, brand, salt composition or scan barcode</p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="w-[400px] flex-shrink-0 bg-white rounded-xl border flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Cart ({cart.length})</h2>
          {cart.length > 0 && <button onClick={clearCart} className="text-xs text-red-500 hover:underline">Clear all</button>}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.key} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.batchNumber} • ₹{item.sellingPrice} • GST {item.gstPercentage}%</p>
                </div>
                <button onClick={() => removeItem(item.key)} className="p-1 text-gray-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 bg-white rounded-lg border">
                  <button onClick={() => updateQty(item.key, -1)} className="p-1.5 hover:bg-gray-100 rounded-l-lg"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(item.key, 1)} className="p-1.5 hover:bg-gray-100 rounded-r-lg"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <span className="text-sm font-semibold">₹{(item.sellingPrice * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer — totals & checkout */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3">
            {hasPrescription && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Prescription required for some items
              </div>
            )}

            {/* Customer */}
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" className="input text-xs py-1.5" />
              <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" className="input text-xs py-1.5" />
            </div>

            {/* Payment mode */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'upi', label: 'UPI', icon: Smartphone },
              ].map(m => (
                <button key={m.id} onClick={() => setPaymentMode(m.id)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                    paymentMode === m.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <m.icon className="h-4 w-4" />{m.label}
                </button>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>GST</span><span>₹{totalGST.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>

            <button onClick={handleCheckout} disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {submitting ? 'Processing...' : `Pay ₹${grandTotal.toFixed(2)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
