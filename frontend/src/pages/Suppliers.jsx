import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, Truck, Phone, Mail, MapPin } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', gstin: '', creditDays: 30, creditLimit: 100000, contact: { phone: '', email: '', contactPerson: '' }, address: { street: '', city: '', state: '', pincode: '' } });

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`/api/suppliers${search ? `?search=${search}` : ''}`);
      setSuppliers(res.data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', code: '', gstin: '', creditDays: 30, creditLimit: 100000, contact: { phone: '', email: '', contactPerson: '' }, address: { street: '', city: '', state: '', pincode: '' } });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, code: s.code, gstin: s.gstin, creditDays: s.creditDays || 30, creditLimit: s.creditLimit || 100000,
      contact: { phone: s.contact?.phone || '', email: s.contact?.email || '', contactPerson: s.contact?.contactPerson || '' },
      address: { street: s.address?.street || '', city: s.address?.city || '', state: s.address?.state || '', pincode: s.address?.pincode || '' }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`/api/suppliers/${editing._id}`, form);
        toast.success('Supplier updated');
      } else {
        await axios.post('/api/suppliers', form);
        toast.success('Supplier created');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save supplier'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this supplier?')) return;
    try { await axios.delete(`/api/suppliers/${id}`); toast.success('Supplier deactivated'); fetchSuppliers(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500">{suppliers.length} suppliers</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Add Supplier</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search suppliers..." />
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s._id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{s.code}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
            </div>

            <div className="space-y-1.5 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /> {s.contact?.phone || '—'}</div>
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /> {s.contact?.email || '—'}</div>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {s.address?.city}, {s.address?.state}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-xs mb-3">
              <div><span className="text-gray-400">GSTIN</span><p className="font-mono font-medium text-gray-700 mt-0.5">{s.gstin}</p></div>
              <div><span className="text-gray-400">Contact Person</span><p className="font-medium text-gray-700 mt-0.5">{s.contact?.contactPerson || '—'}</p></div>
              <div><span className="text-gray-400">Credit Days</span><p className="font-medium text-gray-700 mt-0.5">{s.creditDays} days</p></div>
              <div><span className="text-gray-400">Credit Limit</span><p className="font-medium text-gray-700 mt-0.5">₹{s.creditLimit?.toLocaleString('en-IN')}</p></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="flex-1 btn btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"><Edit className="h-3 w-3" /> Edit</button>
              <button onClick={() => handleDelete(s._id)} className="btn btn-danger text-xs py-1.5 px-3"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <div className="col-span-3 text-center py-10 text-gray-400">No suppliers found</div>}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Supplier Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required /></div>
                <div><label className="label">Supplier Code *</label><input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="input" required /></div>
                <div className="col-span-2"><label className="label">GSTIN *</label><input type="text" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} className="input" required maxLength={15} /></div>
              </div>
              <h3 className="font-semibold text-sm text-gray-700 pt-2">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Phone *</label><input type="text" value={form.contact.phone} onChange={e => setForm({...form, contact: {...form.contact, phone: e.target.value}})} className="input" required /></div>
                <div><label className="label">Email</label><input type="email" value={form.contact.email} onChange={e => setForm({...form, contact: {...form.contact, email: e.target.value}})} className="input" /></div>
                <div className="col-span-2"><label className="label">Contact Person</label><input type="text" value={form.contact.contactPerson} onChange={e => setForm({...form, contact: {...form.contact, contactPerson: e.target.value}})} className="input" /></div>
              </div>
              <h3 className="font-semibold text-sm text-gray-700 pt-2">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Street</label><input type="text" value={form.address.street} onChange={e => setForm({...form, address: {...form.address, street: e.target.value}})} className="input" /></div>
                <div><label className="label">City</label><input type="text" value={form.address.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} className="input" /></div>
                <div><label className="label">State</label><input type="text" value={form.address.state} onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})} className="input" /></div>
              </div>
              <h3 className="font-semibold text-sm text-gray-700 pt-2">Credit Terms</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Credit Days</label><input type="number" value={form.creditDays} onChange={e => setForm({...form, creditDays: parseInt(e.target.value)})} className="input" min="0" /></div>
                <div><label className="label">Credit Limit (₹)</label><input type="number" value={form.creditLimit} onChange={e => setForm({...form, creditLimit: parseInt(e.target.value)})} className="input" min="0" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
