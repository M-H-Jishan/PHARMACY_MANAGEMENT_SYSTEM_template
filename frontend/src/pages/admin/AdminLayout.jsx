import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Navigation, Settings, Menu, X,
  ChevronLeft, Globe, Sliders, Shield, ArrowLeft
} from 'lucide-react';

const adminNav = [
  { name: 'Admin Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'CMS Pages', href: '/admin/cms', icon: FileText },
  { name: 'Navigation', href: '/admin/navigation', icon: Navigation },
  { name: 'Site Settings', href: '/admin/settings', icon: Settings },
  { name: 'System Config', href: '/admin/system', icon: Sliders },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-xl z-50">
            <AdminSidebar nav={adminNav} current={location.pathname} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="w-64 flex flex-col">
          <AdminSidebar nav={adminNav} current={location.pathname} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-800">
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">Admin Panel</span>
                <span className="hidden sm:block text-xs text-gray-500 ml-2">Logged in as {user?.name}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminSidebar({ nav, current, onClose }) {
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-800">
        <Link to="/admin" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white">Admin Panel</h1>
            <p className="text-[10px] text-gray-500 tracking-wider uppercase">CMS & Settings</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded text-gray-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = item.exact ? current === item.href : current.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-gray-800 mt-4">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-white transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="px-3 py-2 rounded-lg bg-gray-800">
          <p className="text-xs text-gray-500">PharmaPOS Admin</p>
          <p className="text-[10px] text-gray-600 mt-0.5">CMS & Configuration</p>
        </div>
      </div>
    </div>
  );
}
