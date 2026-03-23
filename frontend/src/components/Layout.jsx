import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, BarChart3,
  Truck, Users, Menu, X, LogOut, ChevronDown, Bell, Pill
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'POS Billing', href: '/pos', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'manager'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50">
            <SidebarContent items={filteredNav} current={location.pathname} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="w-64 flex flex-col">
          <SidebarContent items={filteredNav} current={location.pathname} />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-sm font-medium text-gray-500">{user?.storeId?.name || 'HealthFirst Pharmacy'}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>

              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-40 py-1">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ items, current, onClose }) {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="h-9 w-9 rounded-lg bg-primary-500 flex items-center justify-center">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">PharmaPOS</h1>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase">Management System</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = item.href === '/' ? current === '/' : current.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700">
        <div className="px-3 py-2 rounded-lg bg-slate-800">
          <p className="text-xs text-slate-400">Pharmacy Management System</p>
          <p className="text-[10px] text-slate-500 mt-0.5">v1.0.0 — MVP</p>
        </div>
      </div>
    </div>
  );
}
