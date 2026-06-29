import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCMS } from '../context/CMSContext';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, BarChart3,
  Truck, Users, Menu, X, LogOut, ChevronDown, Bell, Pill,
  FileText, Settings, Navigation, Globe, Sliders, Home,
  Info, Phone, Mail, Star, Heart, Book, Clipboard, Calendar,
  Shield, Search, Map, Camera, Award, ChevronRight
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard, ShoppingCart, Package, Warehouse, BarChart3, Truck,
  Users, FileText, Settings, Navigation, Globe, Sliders, Home,
  Info, Phone, Mail, Star, Heart, Book, Clipboard, Calendar,
  Shield, Search, Map, Camera, Award
};

const FALLBACK_NAV = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard', roles: [], isVisible: true, children: [] },
  { label: 'POS Billing', href: '/pos', icon: 'ShoppingCart', roles: [], isVisible: true, children: [] },
  { label: 'Products', href: '/products', icon: 'Package', roles: [], isVisible: true, children: [] },
  { label: 'Inventory', href: '/inventory', icon: 'Warehouse', roles: [], isVisible: true, children: [] },
  { label: 'Suppliers', href: '/suppliers', icon: 'Truck', roles: [], isVisible: true, children: [] },
  { label: 'Reports', href: '/reports', icon: 'BarChart3', roles: [], isVisible: true, children: [] },
  { label: 'Users', href: '/users', icon: 'Users', roles: ['admin', 'manager'], isVisible: true, children: [] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { navigation, settings } = useCMS();
  const location = useLocation();
  const navigate = useNavigate();

  const rawItems = navigation?.items?.length ? navigation.items : FALLBACK_NAV;
  const navItems = rawItems.filter(item => {
    if (!item.isVisible) return false;
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user?.role);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pharmacyName = settings?.pharmacyName || user?.storeId?.name || 'HealthFirst Pharmacy';
  const siteName = settings?.siteName || 'PharmaPOS';

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50">
            <SidebarContent items={navItems} current={location.pathname} onClose={() => setSidebarOpen(false)} user={user} siteName={siteName} settings={settings} />
          </aside>
        </div>
      )}

      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="w-64 flex flex-col">
          <SidebarContent items={navItems} current={location.pathname} user={user} siteName={siteName} settings={settings} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-sm font-medium text-gray-500">{pharmacyName}</h2>
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
                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border z-40 py-1">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-violet-600 hover:bg-violet-50">
                          <Shield className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
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

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ items, current, onClose, user, siteName, settings }) {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const sidebarBg = settings?.sidebarColor || '#0f172a';

  const toggleDropdown = (idx) => setOpenDropdowns(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="h-full flex flex-col text-white" style={{ backgroundColor: sidebarBg }}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={siteName} className="h-9 w-9 rounded-lg object-contain" onError={e => e.target.style.display = 'none'} />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-primary-500 flex items-center justify-center">
              <Pill className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-base font-bold leading-tight">{siteName}</h1>
            <p className="text-[10px] text-white/40 tracking-wider uppercase">{settings?.tagline || 'Management System'}</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item, idx) => {
          const IconComp = ICON_MAP[item.icon] || FileText;
          const hasChildren = item.children && item.children.length > 0;
          const visibleChildren = hasChildren ? item.children.filter(c => c.isVisible !== false) : [];
          const isActive = item.href === '/' ? current === '/' : current.startsWith(item.href);
          const childActive = visibleChildren.some(c => current.startsWith(c.href));
          const isOpen = openDropdowns[idx] || childActive;

          if (visibleChildren.length > 0) {
            return (
              <div key={idx}>
                <button
                  onClick={() => toggleDropdown(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    childActive ? 'bg-primary-600 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <IconComp className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <div className="ml-8 mt-0.5 space-y-0.5">
                    {visibleChildren.map((child, cidx) => {
                      const ChildIcon = ICON_MAP[child.icon] || FileText;
                      const childIsActive = current.startsWith(child.href);
                      return (
                        <Link
                          key={cidx}
                          to={child.href}
                          onClick={onClose}
                          target={child.type === 'external' ? '_blank' : undefined}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            childIsActive ? 'bg-primary-600 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              to={item.href}
              onClick={onClose}
              target={item.type === 'external' ? '_blank' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <IconComp className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="pt-2 mt-2 border-t border-white/10">
            <Link
              to="/admin"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                current.startsWith('/admin')
                  ? 'bg-violet-600 text-white'
                  : 'text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-2 rounded-lg bg-white/5">
          <p className="text-xs text-white/40">{settings?.pharmacyName || 'Pharmacy Management'}</p>
          <p className="text-[10px] text-white/20 mt-0.5">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
