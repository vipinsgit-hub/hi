import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Chat } from '@/pages/Chat';
import { AccessPending } from '@/pages/AccessPending';
import { NotFound } from '@/pages/NotFound';
import { Loader2 } from 'lucide-react';

const ProtectedChatRoute: React.FC = () => {
  const { user, isLoading, accessStatus } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-bg-main text-text-muted gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-text-primary" />
        <span className="text-xs font-mono">Authenticating session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (accessStatus === 'pending_approval' || accessStatus === 'unauthorized') {
    return <Navigate to="/access-pending" replace />;
  }

  return (
    <AppLayout>
      <Chat />
    </AppLayout>
  );
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, accessStatus } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-bg-main text-text-muted gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-text-primary" />
      </div>
    );
  }

  if (user) {
    if (accessStatus === 'authorized') {
      return <Navigate to="/chat" replace />;
    }
    return <Navigate to="/access-pending" replace />;
  }

  return <>{children}</>;
};

const AccessPendingRoute: React.FC = () => {
  const { user, isLoading, accessStatus } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-bg-main text-text-muted gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (accessStatus === 'authorized') {
    return <Navigate to="/chat" replace />;
  }

  return <AccessPending />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <ResetPassword />
              }
            />

            {/* Access Pending Guarded Route */}
            <Route path="/access-pending" element={<AccessPendingRoute />} />

            {/* Private Chat Route */}
            <Route path="/chat" element={<ProtectedChatRoute />} />

            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/chat" replace />} />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;

