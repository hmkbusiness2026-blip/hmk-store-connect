import { Home, Gamepad2, Search, MessageSquare, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface BottomNavProps {
  onSearchClick?: () => void;
}

const BottomNav = ({ onSearchClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const leftItems = [
    { icon: Home, label: t('home'), path: '/' },
    { icon: Gamepad2, label: 'Game', path: '/', anchor: 'games-grid' as const },
  ];

  const rightItems = [
    { icon: MessageSquare, label: t('orders'), path: '/orders' },
    { icon: User, label: t('profile'), path: '/profile' },
  ];

  const handleNav = (path: string, anchor?: string) => {
    if (anchor && location.pathname === path) {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(path);
      if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  };

  const handleSearch = () => {
    if (onSearchClick) return onSearchClick();
    if (location.pathname !== '/') navigate('/');
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('input[type="text"]');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const NavBtn = ({ icon: Icon, label, onClick, active }: any) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
      <span className="text-[10px] font-display font-semibold tracking-wide">{label}</span>
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="relative max-w-lg mx-auto">
        {/* Floating search */}
        <button
          onClick={handleSearch}
          aria-label="Search"
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_24px_hsl(var(--primary)/0.5)] active:scale-95 transition-transform border-4 border-background"
        >
          <Search size={22} strokeWidth={2.5} />
        </button>

        <div className="glass border-t border-border h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            {leftItems.map((it, i) => (
              <NavBtn
                key={i}
                icon={it.icon}
                label={it.label}
                active={i === 0 && location.pathname === '/'}
                onClick={() => handleNav(it.path, it.anchor)}
              />
            ))}
          </div>
          <div className="w-14" />
          <div className="flex items-center gap-1">
            {rightItems.map((it, i) => (
              <NavBtn
                key={i}
                icon={it.icon}
                label={it.label}
                active={location.pathname === it.path}
                onClick={() => navigate(it.path)}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
