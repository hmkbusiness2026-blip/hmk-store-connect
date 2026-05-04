import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import OrdersPage from "./pages/OrdersPage";
import VipPage from "./pages/VipPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import OwnerPage from "./pages/OwnerPage";
import AdminCustomize from "./pages/AdminCustomize";
import NotFound from "./pages/NotFound";
import StaffLayout from "./pages/staff/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffPlaceholder from "./pages/staff/StaffPlaceholder";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";

const StaffGuard = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const { isStaff } = usePermissions();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/" replace />;
  return children;
};

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display font-bold text-xl gradient-text animate-pulse">HMK STORE</div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/orders" element={user ? <OrdersPage /> : <AuthPage />} />
        <Route path="/vip" element={user ? <VipPage /> : <AuthPage />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <AuthPage />} />
        <Route path="/admin" element={user ? <AdminPage /> : <AuthPage />} />
        <Route path="/admin/customize" element={user ? <AdminCustomize /> : <AuthPage />} />
        <Route path="/owner" element={user ? <OwnerPage /> : <AuthPage />} />
        <Route path="/staff" element={<StaffGuard><StaffLayout /></StaffGuard>}>
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="orders" element={<AdminPage />} />
          <Route path="inbox" element={<StaffPlaceholder title="Unified Inbox" />} />
          <Route path="inventory" element={<StaffPlaceholder title="Inventory" />} />
          <Route path="audit" element={<StaffPlaceholder title="Audit Logs" />} />
          <Route path="staff" element={<StaffPlaceholder title="Staff Management" />} />
          <Route path="schedules" element={<StaffPlaceholder title="Schedules" />} />
          <Route path="customize" element={<AdminCustomize />} />
          <Route path="shifts" element={<StaffPlaceholder title="Shift Reports" />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
      <WhatsAppButton />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
