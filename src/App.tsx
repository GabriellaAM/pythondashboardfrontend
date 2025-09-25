import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { Suspense } from 'react';
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import Dashboard from "@/pages/Dashboard";
import DashboardPage from "@/pages/DashboardPage";
import Settings from "@/pages/Settings";
import Account from "@/pages/Account";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionar imediatamente para o último dashboard se estiver em "/" ou "/dashboard"
  const path = location.pathname;
  if (path === "/" || path === "/dashboard") {
    const lastId = localStorage.getItem('last_dashboard_id');
    if (lastId) {
      return <Navigate to={`/dashboard/${lastId}`} replace />;
    }
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const DashboardRoute = () => {
  const location = useLocation();
  return <Dashboard key={location.pathname} />;
};

const DashboardPageRoute = () => {
  const location = useLocation();
  return <DashboardPage key={location.pathname} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DashboardProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardPageRoute />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPageRoute />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/:id" element={
              <ProtectedRoute>
                <DashboardPageRoute />
              </ProtectedRoute>
            } />
            {/* Public/Shared routes (no auth required) */}
            <Route path="/public/:id" element={
              <Layout>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>}>
                  <DashboardRoute />
                </Suspense>
              </Layout>
            } />
            <Route path="/share/:token" element={
              <Layout>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>}>
                  <DashboardRoute />
                </Suspense>
              </Layout>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <Layout>
                  <Account />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </DashboardProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;