import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import DynamicPage from './pages/DynamicPage';
import Layout from './components/Layout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CMSManager from './pages/admin/CMSManager';
import PageBuilder from './pages/admin/PageBuilder';
import NavigationManager from './pages/admin/NavigationManager';
import SiteSettings from './pages/admin/SiteSettings';
import SystemConfig from './pages/admin/SystemConfig';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="h-10 w-10 border-4 border-violet-800 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin' && user?.role !== 'manager') return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin Panel */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="cms" element={<CMSManager />} />
        <Route path="cms/new" element={<PageBuilder />} />
        <Route path="cms/:id" element={<PageBuilder />} />
        <Route path="navigation" element={<NavigationManager />} />
        <Route path="settings" element={<SiteSettings />} />
        <Route path="system" element={<SystemConfig />} />
      </Route>

      {/* Main App */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="p/:slug" element={<DynamicPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
