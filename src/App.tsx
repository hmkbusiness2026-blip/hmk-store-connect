import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage";
import AuthPage from "./pages/AuthPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProPage from "./pages/pro/ProPage";
import ProArticlesPage from "./pages/pro/ProArticlesPage";
import ProArticleDetailPage from "./pages/pro/ProArticleDetailPage";
import ProEmotesPage from "./pages/pro/ProEmotesPage";
import ProCompetitionsPage from "./pages/pro/ProCompetitionsPage";
import AdminProArticlesPage from "./pages/admin/AdminProArticlesPage";
import AdminProEmotesPage from "./pages/admin/AdminProEmotesPage";

import VipPage from "./pages/VipPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminArchivePage from "./pages/admin/AdminArchivePage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminControlPage from "./pages/admin/AdminControlPage";
import AdminWorkHistoryPage from "./pages/admin/AdminWorkHistoryPage";
import OwnerPage from "./pages/OwnerPage";
import OwnerLayout from "./pages/owner/OwnerLayout";
import OwnerLeaderPage from "./pages/owner/OwnerLeaderPage";
import OwnerOrdersPage from "./pages/owner/OwnerOrdersPage";
import OwnerReportsPage from "./pages/owner/OwnerReportsPage";
import OwnerProfilePage from "./pages/owner/OwnerProfilePage";
import OwnerLogsPage from "./pages/owner/OwnerLogsPage";
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
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <img src={hmkLogo} alt="HMK Store" className="w-24 h-24 object-contain animate-pulse drop-shadow-[0_0_18px_rgba(255,176,0,0.45)]" />
        <div className="font-display font-bold text-xl gradient-text tracking-widest">HMK STORE</div>
      </div>
    );
  }

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin' || isOwner;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isOwnerRoute = location.pathname.startsWith('/owner');

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/game/:gameId/:serverId" element={<ProductsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/auth" element={user ? <Navigate to={isOwner ? "/owner/leader" : isAdmin ? "/admin/orders" : "/"} replace /> : <AuthPage />} />
        <Route path="/orders" element={user ? <OrdersPage /> : <AuthPage />} />
        <Route path="/orders/:id" element={user ? <OrderDetailPage /> : <AuthPage />} />
        <Route path="/pro" element={<ProPage />} />
        <Route path="/pro/articles" element={user ? <ProArticlesPage /> : <AuthPage />} />
        <Route path="/pro/articles/:id" element={user ? <ProArticleDetailPage /> : <AuthPage />} />
        <Route path="/pro/emotes" element={user ? <ProEmotesPage /> : <AuthPage />} />
        <Route path="/pro/competitions" element={user ? <ProCompetitionsPage /> : <AuthPage />} />

        <Route path="/vip" element={user ? <VipPage /> : <AuthPage />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <AuthPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="archive" element={<AdminArchivePage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="control" element={<AdminControlPage />} />
          <Route path="history" element={<AdminWorkHistoryPage />} />
          <Route path="pro-articles" element={<AdminProArticlesPage />} />
          <Route path="pro-emotes" element={<AdminProEmotesPage />} />
        </Route>
        <Route path="/admin/customize" element={user ? <AdminCustomize /> : <AuthPage />} />
        <Route path="/admin/legacy" element={user ? <AdminPage /> : <AuthPage />} />
        <Route path="/owner-legacy" element={user ? <OwnerPage /> : <AuthPage />} />
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="/owner/leader" replace />} />
          <Route path="leader" element={<OwnerLeaderPage />} />
          <Route path="orders" element={<OwnerOrdersPage />} />
          <Route path="reports" element={<OwnerReportsPage />} />
          <Route path="profile" element={<OwnerProfilePage />} />
          <Route path="logs" element={<OwnerLogsPage />} />
          <Route path="users" element={<OwnerPage />} />
        </Route>
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
      {!isAdminRoute && !isOwnerRoute && <BottomNav />}
      {!isAdminRoute && !isOwnerRoute && <WhatsAppButton />}
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
