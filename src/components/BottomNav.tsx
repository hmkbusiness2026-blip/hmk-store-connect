import { Home, MessageSquare, User, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import FavoriteGameModal from './FavoriteGameModal';
import { games } from '@/lib/gameData';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { user, favoriteGame, setFavoriteGame } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const favoriteGameData = favoriteGame ? games.find((g) => g.id === favoriteGame) : null;

  const handleFavorite = () => {
    if (!user) return navigate('/auth');
    if (!favoriteGame) return setPickerOpen(true);
    navigate(`/?game=${favoriteGame}`);
  };

  const items = [
    { icon: Home, label: t('home'), path: '/' },
    { icon: MessageSquare, label: lang === 'ar' ? 'طلباتي' : 'My Orders', path: '/orders' },
    { icon: User, label: lang === 'ar' ? 'الملف الشخصي' : 'Profile', path: '/profile' },
  ];

  const NavBtn = ({ icon: Icon, label, onClick, active }: any) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors flex-1 ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
      <span className="text-[10px] font-display font-semibold tracking-wide">{label}</span>
    </button>
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="relative max-w-lg mx-auto">
          {/* Floating center button */}
          <div
            className="absolute left-1/2 z-50 flex flex-col items-center pointer-events-none"
            style={{ transform: 'translateX(-50%)', top: '-30px' }}
          >
            <button
              onClick={handleFavorite}
              aria-label={lang === 'ar' ? 'اللعبة المفضلة' : 'Favorite Game'}
              className="pointer-events-auto w-[60px] h-[60px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_28px_hsl(var(--primary)/0.55)] active:scale-95 transition-transform overflow-hidden"
              style={{ border: '4px solid hsl(var(--background))' }}
            >
              {favoriteGameData ? (
                <img
                  src={favoriteGameData.image}
                  alt={favoriteGameData.name}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <Star size={22} strokeWidth={2.5} className="fill-current" />
              )}
            </button>
          </div>

          <div className="glass border-t border-border h-16 flex items-stretch">
            {/* Right group (RTL) / left group (LTR): Home */}
            <div className="flex-1 flex justify-end">
              <NavBtn
                icon={items[0].icon}
                label={items[0].label}
                active={location.pathname === '/'}
                onClick={() => navigate('/')}
              />
            </div>

            {/* Center spacer with label */}
            <div className="w-20 flex items-end justify-center pb-1 shrink-0">
              <span className="text-[10px] font-display font-semibold tracking-wide text-muted-foreground">
                {lang === 'ar' ? 'لعبتي' : 'Game'}
              </span>
            </div>

            {/* Left group: Orders + Profile */}
            <div className="flex-1 flex justify-start">
              <NavBtn
                icon={items[1].icon}
                label={items[1].label}
                active={location.pathname === '/orders'}
                onClick={() => navigate('/orders')}
              />
              <NavBtn
                icon={items[2].icon}
                label={items[2].label}
                active={location.pathname === '/profile'}
                onClick={() => navigate('/profile')}
              />
            </div>
          </div>
        </div>
      </nav>

      <FavoriteGameModal
        open={pickerOpen}
        dismissible
        onClose={() => setPickerOpen(false)}
        onSelect={async (id) => {
          await setFavoriteGame(id);
          setPickerOpen(false);
          navigate(`/?game=${id}`);
        }}
      />
    </>
  );
};

export default BottomNav;
