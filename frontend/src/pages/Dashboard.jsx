import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp,
  Clock, ArrowUpRight, ArrowDownRight, Activity, Pill
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/reports/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [isAuthenticated]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  const stats = [
    { label: "Today's Revenue", value: `₹${(data?.todayRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-emerald-500', change: `${data?.todayOrders || 0} orders` },
    { label: 'Weekly Revenue', value: `₹${(data?.weekRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-blue-500', change: `${data?.weekOrders || 0} orders` },
    { label: 'Monthly Revenue', value: `₹${(data?.monthRevenue || 0).toLocaleString('en-IN')}`, icon: ShoppingCart, color: 'bg-purple-500', change: `${data?.monthOrders || 0} orders` },
    { label: 'Total Products', value: data?.totalProducts || 0, icon: Package, color: 'bg-amber-500', change: 'Active SKUs' },
  ];

  const alerts = [
    data?.lowStock > 0 && { type: 'warning', icon: AlertTriangle, msg: `${data.lowStock} items are running low on stock`, link: '/inventory' },
    data?.expiredCount > 0 && { type: 'danger', icon: Clock, msg: `${data.expiredCount} batches have expired`, link: '/inventory' },
    data?.nearExpiryCount > 0 && { type: 'info', icon: Activity, msg: `${data.nearExpiryCount} batches expiring within 90 days`, link: '/inventory' },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <Link to="/pos" className="btn btn-primary flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" /> New Sale
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.change}</p>
              </div>
              <div className={`${s.color} p-2.5 rounded-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
            <Link to="/reports" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {(data?.recentInvoices || []).slice(0, 8).map((inv) => (
                  <tr key={inv._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-gray-600">{inv.customerName || '—'}</td>
                    <td className="px-5 py-3 font-medium">₹{inv.grandTotal?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3"><span className="capitalize text-gray-600">{inv.paymentMode}</span></td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data?.recentInvoices || data.recentInvoices.length === 0) && (
              <div className="text-center py-8 text-gray-400">No invoices yet</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Alerts</h3>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <Link key={i} to={a.link} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    a.type === 'danger' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                    a.type === 'warning' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
                    'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}>
                    <a.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      a.type === 'danger' ? 'text-red-500' : a.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                    }`} />
                    <span className={`text-sm ${
                      a.type === 'danger' ? 'text-red-700' : a.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
                    }`}>{a.msg}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Top Products (30 days)</h3>
            <div className="space-y-3">
              {(data?.topProducts || []).map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-bold">{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{p._id}</p>
                      <p className="text-xs text-gray-400">{p.totalQty} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">₹{Math.round(p.totalRevenue).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
              )}
            </div>
          </div>

          {/* Sales Chart (simple bar) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Last 7 Days</h3>
            <div className="flex items-end gap-1.5 h-28">
              {(data?.dailySales || []).map((d, i) => {
                const maxRev = Math.max(...(data?.dailySales || []).map(x => x.revenue), 1);
                const pct = (d.revenue / maxRev) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">₹{d.revenue > 999 ? `${(d.revenue/1000).toFixed(1)}k` : d.revenue}</span>
                    <div className="w-full bg-primary-100 rounded-t-sm" style={{ height: `${Math.max(pct, 4)}%` }}>
                      <div className="w-full h-full bg-primary-500 rounded-t-sm opacity-80" />
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
