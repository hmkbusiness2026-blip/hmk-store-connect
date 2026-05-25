import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminBottomNav from '@/components/AdminBottomNav';

const AdminLayout = () => {
  const { user, userRole, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  const isAdmin = userRole === 'admin' || (userRole as string) === 'owner';
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <header className="sticky top-0 z-30 glass border-b border-border/60 px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-display font-extrabold text-lg gradient-text">لوحة الإدارة</h1>
          <span className="text-[10px] text-muted-foreground">HMK STORE</span>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Outlet />
      </div>
      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;
