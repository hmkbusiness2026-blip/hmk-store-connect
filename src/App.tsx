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
import InboxPage from "./pages/staff/InboxPage";
import InventoryPage from "./pages/staff/InventoryPage";
import AuditLogsPage from "./pages/staff/AuditLogsPage";
import StaffManagementPage from "./pages/staff/StaffManagementPage";
import SchedulesPage from "./pages/staff/SchedulesPage";
import ShiftReportsPage from "./pages/staff/ShiftReportsPage";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import hmkLogo from "@/assets/hmk-logo.png";

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <img src={hmkLogo} alt="HMK Store" className="w-24 h-24 object-contain animate-pulse drop-shadow-[0_0_18px_rgba(255,176,0,0.45)]" />
        <div className="font-display font-bold text-xl gradient-text tracking-widest">HMK STORE</div>
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
          <Route path="inbox" element={<InboxPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="customize" element={<AdminCustomize />} />
          <Route path="shifts" element={<ShiftReportsPage />} />
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
