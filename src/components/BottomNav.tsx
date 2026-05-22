import { Home, ShoppingBag, Crown, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: t('home'), path: '/' },
    { icon: ShoppingBag, label: t('orders'), path: '/orders' },
    ...(user ? [{ icon: Crown, label: t('vip'), path: '/vip' }] : []),
    { icon: User, label: t('profile'), path: '/profile' },
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${
                active
                  ? 'text-primary text-glow-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-display font-semibold uppercase tracking-wider">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
