import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, AlertTriangle, Clock, Package, Warehouse,
  TrendingDown, Filter, ArrowDown
} from 'lucide-react';

export default function Inventory() {
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, statsRes] = await Promise.all([
          axios.get(`/api/inventory?filter=${filter}&search=${search}`),
          axios.get('/api/inventory/dashboard')
        ]);
        setBatches(invRes.data.data || []);
        setStats(statsRes.data.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, [filter, search]);

  const getStatus = (b) => {
    const now = new Date();
    const exp = new Date(b.expiryDate);
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700', sort: 0 };
    if (daysLeft <= 90) return { label: `${daysLeft}d left`, color: 'bg-amber-100 text-amber-700', sort: 1 };
    if (b.quantity <= b.minStockLevel) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700', sort: 2 };
    if (b.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', sort: 0 };
    return { label: 'Normal', color: 'bg-green-100 text-green-700', sort: 3 };
  };

  const filters = [
    { id: '', label: 'All Batches', icon: Package },
    { id: 'low-stock', label: 'Low Stock', icon: TrendingDown },
    { id: 'near-expiry', label: 'Near Expiry', icon: Clock },
    { id: 'expired', label: 'Expired', icon: AlertTriangle },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-sm text-gray-500">Monitor stock levels, expiry dates, and batch details</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total Stock', value: stats.totalStock?.toLocaleString(), icon: Warehouse, color: 'text-purple-600 bg-purple-50' },
            { label: 'Stock Value', value: `₹${stats.totalValue?.toLocaleString('en-IN')}`, icon: ArrowDown, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Low Stock', value: stats.lowStockCount, icon: TrendingDown, color: 'text-orange-600 bg-orange-50' },
            { label: 'Expired', value: stats.expiredCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-white rounded-lg border p-0.5 gap-0.5">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <f.icon className="h-3.5 w-3.5" />{f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search by product or batch..." />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Batch</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">MRP</th>
              <th className="px-4 py-3 font-medium">Purchase Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Min Level</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {batches.map(b => {
                const status = getStatus(b);
                return (
                  <tr key={b._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{b.productId?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{b.productId?.brandName}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{b.batchNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">₹{b.mrp}</td>
                    <td className="px-4 py-3 text-gray-500">₹{b.purchasePrice}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${b.quantity <= b.minStockLevel ? 'text-red-600' : 'text-gray-900'}`}>{b.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{b.minStockLevel}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.supplierId?.name || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {batches.length === 0 && <div className="text-center py-10 text-gray-400">No batches found</div>}
        </div>
      </div>
    </div>
  );
}
