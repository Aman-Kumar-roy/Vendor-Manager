import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { DashboardPage } from './modules/placeholders/DashboardPage';
import { SellerListPage } from './modules/seller/pages/SellerListPage';
import { SellerDetailPage } from './modules/seller/pages/SellerDetailPage';
import { OrdersPage } from './modules/placeholders/OrdersPage';
import { ReceiptsPage } from './modules/receipts/ReceiptsPage';
import { ReportsPage } from './modules/reports/ReportsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Shell Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/sellers" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="sellers" element={<SellerListPage />} />
            <Route path="sellers/:id" element={<SellerDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="receipts" element={<ReceiptsPage />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/sellers" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
