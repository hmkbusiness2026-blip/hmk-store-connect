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
        <Route path="/staff" element={user ? <AdminPage /> : <AuthPage />} />
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
