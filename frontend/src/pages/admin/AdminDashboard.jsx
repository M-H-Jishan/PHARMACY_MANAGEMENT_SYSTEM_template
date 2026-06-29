import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCMS } from '../../context/CMSContext';
import {
  FileText, Navigation, Settings, Users, Package, BarChart3,
  Globe, Eye, EyeOff, Plus, ArrowUpRight, Sliders, Shield,
  ShoppingCart, Warehouse, Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const { settings, cmsPages } = useCMS();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, productsRes, dashRes] = await Promise.allSettled([
          axios.get('/api/users'),
          axios.get('/api/products'),
          axios.get('/api/reports/dashboard'),
        ]);
        setStats({
          users: usersRes.status === 'fulfilled' ? usersRes.value.data.users?.length || 0 : 0,
          products: productsRes.status === 'fulfilled' ? productsRes.value.data.products?.length || 0 : 0,
          todayRevenue: dashRes.status === 'fulfilled' ? dashRes.value.data.data?.todayRevenue || 0 : 0,
          totalOrders: dashRes.status === 'fulfilled' ? dashRes.value.data.data?.todayOrders || 0 : 0,
          lowStock: dashRes.status === 'fulfilled' ? dashRes.value.data.data?.lowStock || 0 : 0,
        });
      } catch (err) {
        console.error('Admin stats fetch error:', err);
      }
    };
    fetchStats();
  }, []);

  const publishedPages = cmsPages.filter(p => p.isPublished).length;

  const cmsCards = [
    { title: 'CMS Pages', value: cmsPages.length, sub: `${publishedPages} published`, icon: FileText, href: '/admin/cms', color: 'from-violet-500 to-violet-700', action: 'Manage Pages' },
    { title: 'Navigation', value: 'Dynamic', sub: 'Drag to reorder', icon: Navigation, href: '/admin/navigation', color: 'from-blue-500 to-blue-700', action: 'Edit Nav' },
    { title: 'Site Settings', value: settings?.siteName || 'PharmaPOS', sub: 'Branding & Identity', icon: Settings, href: '/admin/settings', color: 'from-emerald-500 to-emerald-700', action: 'Edit Settings' },
    { title: 'System Config', value: 'Thresholds', sub: 'Stock & Expiry rules', icon: Sliders, href: '/admin/system', color: 'from-amber-500 to-amber-700', action: 'Configure' },
  ];

  const appStats = [
    { label: 'Total Users', value: stats?.users ?? '—', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', href: '/users' },
    { label: 'Total Products', value: stats?.products ?? '—', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50', href: '/products' },
    { label: "Today's Revenue", value: stats ? `₹${stats.todayRevenue.toLocaleString('en-IN')}` : '—', icon: ShoppingCart, color: 'text-violet-500', bg: 'bg-violet-50', href: '/reports' },
    { label: 'Low Stock Items', value: stats?.lowStock ?? '—', icon: Warehouse, color: 'text-red-500', bg: 'bg-red-50', href: '/inventory' },
  ];

  const quickActions = [
    { label: 'New CMS Page', href: '/admin/cms/new', icon: Plus, color: 'bg-violet-600 hover:bg-violet-700' },
    { label: 'View Website', href: '/', icon: Globe, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Manage Users', href: '/users', icon: Users, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'View Reports', href: '/reports', icon: BarChart3, color: 'bg-amber-600 hover:bg-amber-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your website, content, and system settings</p>
        </div>
        <Link to="/admin/cms/new" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> New Page
        </Link>
      </div>

      {/* App Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {appStats.map((s, i) => (
          <Link key={i} to={s.href} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-white mt-1">{s.value}</p>
              </div>
              <div className={`${s.bg} p-2.5 rounded-lg`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CMS Modules */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">CMS & Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cmsCards.map((card, i) => (
            <Link key={i} to={card.href} className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/20">
              <div className={`h-1.5 bg-gradient-to-r ${card.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${card.color} bg-opacity-10`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                  <p className="text-lg font-bold text-white mt-1 truncate">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
                </div>
                <div className={`mt-4 text-xs font-medium text-center py-1.5 rounded-lg bg-gradient-to-r ${card.color} text-white opacity-0 group-hover:opacity-100 transition-opacity`}>
                  {card.action}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CMS Pages list */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white text-sm">CMS Pages</h3>
            <Link to="/admin/cms" className="text-xs text-violet-400 hover:text-violet-300">View all</Link>
          </div>
          {cmsPages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No CMS pages yet</p>
              <Link to="/admin/cms/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300">
                <Plus className="h-3.5 w-3.5" /> Create your first page
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {cmsPages.slice(0, 8).map((page) => (
                <div key={page._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${page.isPublished ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{page.title}</p>
                      <p className="text-xs text-gray-500">/p/{page.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${page.isPublished ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <Link to={`/admin/cms/${page._id}`} className="text-xs text-gray-500 hover:text-violet-400 transition-colors">Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action, i) => (
                <Link key={i} to={action.href} className={`flex items-center gap-3 px-4 py-2.5 ${action.color} text-white text-sm font-medium rounded-lg transition-colors`}>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Site Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Site Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Maintenance Mode</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${settings?.maintenanceMode ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                  {settings?.maintenanceMode ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Site Name</span>
                <span className="text-xs text-white font-medium truncate max-w-[120px]">{settings?.siteName || 'PharmaPOS'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Currency</span>
                <span className="text-xs text-white font-medium">{settings?.currencyCode || 'INR'} ({settings?.currency || '₹'})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Published Pages</span>
                <span className="text-xs text-white font-medium">{publishedPages} / {cmsPages.length}</span>
              </div>
              <Link to="/admin/settings" className="block text-center text-xs text-violet-400 hover:text-violet-300 mt-2 pt-2 border-t border-gray-800">
                Edit Settings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
