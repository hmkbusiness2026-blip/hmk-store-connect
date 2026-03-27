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

  if (!user) return <AuthPage />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/vip" element={<VipPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/owner" element={<OwnerPage />} />
        <Route path="/staff" element={<AdminPage />} />
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
