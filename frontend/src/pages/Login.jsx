import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pill, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password);
    if (result.success) navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-4">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">PharmaPOS</h1>
          <p className="text-slate-400 mt-1">Pharmacy Management System</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to continue to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="input pl-10" placeholder="Enter username" required autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10" placeholder="Enter password" required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { role: 'Admin', user: 'admin', pass: 'admin123' },
                { role: 'Manager', user: 'manager', pass: 'manager123' },
                { role: 'Pharmacist', user: 'pharmacist', pass: 'pharmacist123' },
                { role: 'Cashier', user: 'cashier', pass: 'cashier123' },
              ].map(cred => (
                <button key={cred.role} type="button"
                  onClick={() => { setUsername(cred.user); setPassword(cred.pass); }}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                  <span className="font-semibold text-gray-700 block">{cred.role}</span>
                  <span className="text-gray-400">{cred.user}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
