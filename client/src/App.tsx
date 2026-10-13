import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';

// Page Views
import { LandingPage } from './pages/LandingPage';
import { ComplaintWizard } from './pages/ComplaintWizard';
import { MyComplaints } from './pages/MyComplaints';
import { AdminDashboard } from './pages/AdminDashboard';
import { ComplaintManagement } from './pages/ComplaintManagement';
import { ComplaintDetail } from './pages/ComplaintDetail';
import { ReportedIssuesMap } from './pages/ReportedIssuesMap';
import { LoginPage } from './pages/LoginPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4"
        role="status"
        aria-live="polite"
      >
        <div className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-brand-cyan animate-spin" />
        <p className="text-sm font-medium text-slate-300">
          Verifying CivicFlow Authorization...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (user?.role === 'CIVIC_OFFICIAL' || user?.role === 'ADMINISTRATOR') {
    return <Navigate to="/admin" replace />;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<RootRoute />} />
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'official', 'admin']}>
                    <ComplaintWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-complaints"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'official', 'admin']}>
                    <MyComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['official', 'admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <ProtectedRoute allowedRoles={['official', 'admin']}>
                    <ComplaintManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['official', 'admin']}>
                    <ComplaintDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'official', 'admin']}>
                    <ReportedIssuesMap />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
