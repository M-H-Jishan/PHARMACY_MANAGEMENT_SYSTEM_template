import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Package, X, ChevronDown, Eye } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [form, setForm] = useState({ name: '', genericName: '', brandName: '', manufacturer: '', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '', saltComposition: '' });

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (catFilter) params.append('category', catFilter);
      const res = await axios.get(`/api/products?${params}`);
      setProducts(res.data.data || []);
    } catch (err) { toast.error('Failed to load products'); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [search, catFilter]);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ name: '', genericName: '', brandName: '', manufacturer: '', category: 'tablet', hsnCode: '30049099', gstPercentage: 12, unit: 'strip', packSize: 10, requiresPrescription: false, scheduleType: 'none', barcode: '', saltComposition: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, genericName: p.genericName || '', brandName: p.brandName || '', manufacturer: p.manufacturer || '', category: p.category, hsnCode: p.hsnCode, gstPercentage: p.gstPercentage, unit: p.unit, packSize: p.packSize, requiresPrescription: p.requiresPrescription, scheduleType: p.scheduleType || 'none', barcode: p.barcode || '', saltComposition: p.saltComposition || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct._id}`, form);
        toast.success('Product updated');
      } else {
        await axios.post('/api/products', form);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const openView = async (id) => {
    try {
      const res = await axios.get(`/api/products/${id}`);
      setViewProduct(res.data.data);
    } catch { toast.error('Failed to load product details'); }
  };

  const categories = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} products found</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Add Product</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search products..." />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-40">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">HSN</th>
              <th className="px-4 py-3 font-medium">GST</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Batches</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.genericName}</div>
                    {p.requiresPrescription && <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded">RX</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.brandName}</td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.hsnCode}</td>
                  <td className="px-4 py-3">{p.gstPercentage}%</td>
                  <td className="px-4 py-3"><span className={`font-medium ${p.totalStock < 10 ? 'text-red-600' : 'text-gray-900'}`}>{p.totalStock ?? 0}</span></td>
                  <td className="px-4 py-3">{p.batchCount ?? 0}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openView(p._id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded hover:bg-gray-100 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="text-center py-10 text-gray-400">No products found</div>}
        </div>
      </div>

      {/* View Product Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setViewProduct(null)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <button onClick={() => setViewProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-4">{viewProduct.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-gray-500">Brand:</span> <span className="font-medium">{viewProduct.brandName}</span></div>
              <div><span className="text-gray-500">Generic:</span> <span className="font-medium">{viewProduct.genericName}</span></div>
              <div><span className="text-gray-500">Manufacturer:</span> <span className="font-medium">{viewProduct.manufacturer}</span></div>
              <div><span className="text-gray-500">Category:</span> <span className="font-medium capitalize">{viewProduct.category}</span></div>
              <div><span className="text-gray-500">HSN:</span> <span className="font-mono">{viewProduct.hsnCode}</span></div>
              <div><span className="text-gray-500">GST:</span> <span className="font-medium">{viewProduct.gstPercentage}%</span></div>
            </div>
            {viewProduct.batches?.length > 0 && (
              <>
                <h3 className="font-semibold mb-2">Batches</h3>
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead><tr className="bg-gray-50 text-gray-500"><th className="px-3 py-2 text-left">Batch</th><th className="px-3 py-2 text-left">Expiry</th><th className="px-3 py-2 text-left">MRP</th><th className="px-3 py-2 text-left">Stock</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                  <tbody>
                    {viewProduct.batches.map(b => (
                      <tr key={b._id} className="border-t">
                        <td className="px-3 py-2 font-mono">{b.batchNumber}</td>
                        <td className="px-3 py-2">{new Date(b.expiryDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-3 py-2">₹{b.mrp}</td>
                        <td className="px-3 py-2 font-medium">{b.quantity}</td>
                        <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Product Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required /></div>
                <div><label className="label">Generic Name</label><input type="text" value={form.genericName} onChange={e => setForm({...form, genericName: e.target.value})} className="input" /></div>
                <div><label className="label">Brand Name</label><input type="text" value={form.brandName} onChange={e => setForm({...form, brandName: e.target.value})} className="input" /></div>
                <div><label className="label">Manufacturer</label><input type="text" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className="input" /></div>
                <div><label className="label">Category *</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="label">HSN Code *</label><input type="text" value={form.hsnCode} onChange={e => setForm({...form, hsnCode: e.target.value})} className="input" required /></div>
                <div><label className="label">GST % *</label><select value={form.gstPercentage} onChange={e => setForm({...form, gstPercentage: parseInt(e.target.value)})} className="input"><option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option></select></div>
                <div><label className="label">Unit</label><select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="input"><option value="strip">Strip</option><option value="bottle">Bottle</option><option value="vial">Vial</option><option value="tube">Tube</option><option value="box">Box</option><option value="packet">Packet</option><option value="piece">Piece</option></select></div>
                <div><label className="label">Pack Size</label><input type="number" value={form.packSize} onChange={e => setForm({...form, packSize: parseInt(e.target.value)})} className="input" min="1" /></div>
                <div><label className="label">Barcode</label><input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="input" /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm({...form, requiresPrescription: e.target.checked})} className="rounded border-gray-300 text-primary-600" /><span className="text-sm">Requires Prescription</span></label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Update' : 'Create'} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
