import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Package, Users, BarChart3, Database, RefreshCw, Server, CheckCircle } from 'lucide-react';

export default function SystemConfig() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashRes, healthRes] = await Promise.allSettled([
          axios.get('/api/reports/dashboard'),
          axios.get('/health'),
        ]);
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data.data);
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statCards = stats ? [
    { label: "Today's Revenue", value: `₹${(stats.todayRevenue || 0).toLocaleString('en-IN')}`, sub: `${stats.todayOrders || 0} orders`, icon: BarChart3, color: 'text-emerald-400' },
    { label: 'Total Products', value: stats.totalProducts || 0, sub: 'Active SKUs', icon: Package, color: 'text-blue-400' },
    { label: 'Low Stock', value: stats.lowStock || 0, sub: 'Need restock', icon: Package, color: 'text-amber-400' },
    { label: 'Expired Batches', value: stats.expiredCount || 0, sub: 'To be removed', icon: Package, color: 'text-red-400' },
  ] : [];

  const systemLinks = [
    { label: 'Manage Products', desc: 'Add, edit and delete products', href: '/products', icon: Package, color: 'from-blue-500 to-blue-700' },
    { label: 'Manage Users', desc: 'User accounts and permissions', href: '/users', icon: Users, color: 'from-violet-500 to-violet-700' },
    { label: 'View Reports', desc: 'Sales, stock and revenue reports', href: '/reports', icon: BarChart3, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Inventory', desc: 'Stock levels and batches', href: '/inventory', icon: Database, color: 'from-amber-500 to-amber-700' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Overview</h1>
        <p className="text-gray-400 text-sm mt-0.5">Real-time system health and management shortcuts</p>
      </div>

      {/* Health Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Server className="h-5 w-5 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Server Health</h2>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Online</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className="text-sm font-bold text-emerald-400">{health?.status || 'OK'}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Environment</p>
            <p className="text-sm font-bold text-white capitalize">{health?.environment || 'development'}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Uptime</p>
            <p className="text-sm font-bold text-white">{health ? `${Math.floor(health.uptime / 60)}m` : '—'}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Database</p>
            <p className="text-sm font-bold text-emerald-400">MongoDB</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">{card.label}</p>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="text-xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">System Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemLinks.map((link, i) => (
            <a key={i} href={link.href} className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
              <div className={`h-1 bg-gradient-to-r ${link.color}`} />
              <div className="p-4">
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${link.color} mb-3`}>
                  <link.icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">{link.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* API Endpoints Reference */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">API Endpoints</h2>
        <div className="space-y-2 font-mono text-xs">
          {[
            ['GET', '/api/cms/public', 'Public CMS pages'],
            ['GET/PUT', '/api/navigation/main', 'Navigation management'],
            ['GET/PUT', '/api/site-settings', 'Site settings'],
            ['GET', '/api/reports/dashboard', 'Dashboard stats'],
            ['GET', '/api/products', 'Product catalog'],
            ['GET', '/api/users', 'User management'],
            ['GET', '/health', 'Server health check'],
          ].map(([method, path, desc], i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800 last:border-0">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold w-14 text-center flex-shrink-0 ${method.includes('PUT') ? 'bg-amber-900/50 text-amber-400' : 'bg-blue-900/50 text-blue-400'}`}>{method}</span>
              <span className="text-gray-300 flex-shrink-0">{path}</span>
              <span className="text-gray-600 ml-auto hidden sm:block">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
