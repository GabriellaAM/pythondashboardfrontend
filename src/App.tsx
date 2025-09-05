import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import DataSources from "@/pages/DataSources";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/10">
        <div className="flex flex-col items-center gap-6 p-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">DataViz Pro</h1>
              <p className="text-sm text-muted-foreground">Analytics Platform</p>
            </div>
          </div>

          {/* Loading Spinner */}
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          
          {/* Loading Text */}
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/10">
        <div className="flex flex-col items-center gap-6 p-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">DataViz Pro</h1>
              <p className="text-sm text-muted-foreground">Analytics Platform</p>
            </div>
          </div>

          {/* Loading Spinner */}
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          
          {/* Loading Text */}
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const DashboardRoute = () => {
  const location = useLocation();
  return <Dashboard key={location.pathname} />;
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/:id" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRoute />
                </Layout>
              </ProtectedRoute>
            } />
            {/* Public/Shared routes (no auth required) */}
            <Route path="/public/:id" element={
              <Layout>
                <DashboardRoute />
              </Layout>
            } />
            <Route path="/share/:token" element={
              <Layout>
                <DashboardRoute />
              </Layout>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/data-sources" element={
              <ProtectedRoute>
                <Layout>
                  <DataSources />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
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