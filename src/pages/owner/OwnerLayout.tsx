import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import OwnerBottomNav from '@/components/OwnerBottomNav';
import { Crown, Wand2 } from 'lucide-react';

const OwnerLayout = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== 'owner') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen pb-24 bg-[#0B0F19]" dir="rtl">
      <header className="sticky top-0 z-30 glass border-b border-border/60 px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-primary text-glow-gold" />
            <h1 className="font-display font-extrabold text-lg gradient-text">لوحة المالك</h1>
          </div>
          <span className="text-[10px] text-muted-foreground tracking-widest">HMK · OWNER</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <Outlet />
      </div>

      {/* Floating customize button — persistent on every owner page */}
      <button
        onClick={() => navigate('/admin/customize')}
        className="fixed bottom-24 left-4 z-40 h-12 px-4 rounded-full gradient-fire text-primary-foreground font-display font-bold text-xs
                   shadow-[0_0_24px_rgba(255,176,0,0.5)] flex items-center gap-2 active:scale-95 transition-all hover:brightness-110"
      >
        <Wand2 size={16} />
        تخصيص نص + صورة
      </button>

      <OwnerBottomNav />
    </div>
  );
};

export default OwnerLayout;
