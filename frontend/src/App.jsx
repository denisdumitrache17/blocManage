import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import Firms from './pages/Firms';
import Invoices from './pages/Invoices';
import Contracts from './pages/Contracts';
import Tenants from './pages/Tenants';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* HOA-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['HOA']} />}>
        <Route element={<Layout />}>
          <Route path="/tenants" element={<Tenants />} />
        </Route>
      </Route>

      {/* PLATFORM_ADMIN-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
