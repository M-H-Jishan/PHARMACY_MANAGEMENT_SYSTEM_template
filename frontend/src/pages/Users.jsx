import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, X, Users as UsersIcon, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  pharmacist: 'bg-purple-100 text-purple-700',
  cashier: 'bg-green-100 text-green-700',
};

const roleIcons = { admin: ShieldAlert, manager: ShieldCheck, pharmacist: Shield, cashier: UsersIcon };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', phone: '', role: 'cashier' });

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', { ...form, storeId: currentUser.storeId?._id || currentUser.storeId });
      toast.success('User created');
      setShowModal(false);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create user'); }
  };

  const toggleStatus = async (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`/api/users/${u._id}`, { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} users registered</p>
        </div>
        <button onClick={() => { setForm({ username: '', password: '', name: '', email: '', phone: '', role: 'cashier' }); setShowModal(true); }}
          className="btn btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Add User</button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['admin', 'manager', 'pharmacist', 'cashier'].map(role => {
          const count = users.filter(u => u.role === role).length;
          const Icon = roleIcons[role];
          return (
            <div key={role} className="bg-white rounded-xl border p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${roleColors[role]}`}><Icon className="h-4 w-4" /></div>
              <div>
                <p className="text-xs text-gray-500 capitalize">{role}s</p>
                <p className="text-lg font-bold text-gray-900">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{u.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                  <td className="px-4 py-3">
                    {u._id !== currentUser.id && (
                      <button onClick={() => toggleStatus(u)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium ${u.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Full Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required /></div>
                <div><label className="label">Username *</label><input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="input" required minLength={3} /></div>
                <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" required minLength={6} /></div>
                <div><label className="label">Role *</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input">
                    <option value="cashier">Cashier</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="manager">Manager</option>
                    {currentUser.role === 'admin' && <option value="admin">Admin</option>}
                  </select>
                </div>
                <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" /></div>
                <div><label className="label">Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
