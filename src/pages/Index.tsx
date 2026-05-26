import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PromoBanner from '@/components/PromoBanner';
import GameGrid from '@/components/GameGrid';
import CheckoutFlow from '@/components/CheckoutFlow';

import ReviewsCarousel from '@/components/ReviewsCarousel';
import SocialLinks from '@/components/SocialLinks';
import AppFooter from '@/components/AppFooter';
import NotificationBell from '@/components/NotificationBell';
import FavoriteGameModal from '@/components/FavoriteGameModal';
import PWAInstallButton from '@/components/PWAInstallButton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence } from 'framer-motion';
import { Globe, Settings, User as UserIcon } from 'lucide-react';
import hmkLogo from '@/assets/hmk-logo.png';

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userRole, favoriteGame, setFavoriteGame, loading } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const adminTopup = searchParams.get('adminTopup') === '1';

  // Admins get redirected to their dashboard unless they explicitly chose Top-up
  useEffect(() => {
    if (!loading && isAdmin && !adminTopup) {
      navigate('/admin/orders', { replace: true });
    }
  }, [loading, isAdmin, adminTopup, navigate]);


  // Redirect legacy ?game=ID links to the new server-selection page.
  useEffect(() => {
    const g = searchParams.get('game');
    if (g) {
      searchParams.delete('game');
      setSearchParams(searchParams, { replace: true });
      navigate(`/game/${g}`, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

  const onboardingKey = user ? `hmk_onboarded_${user.id}` : '';
  const alreadyOnboarded = onboardingKey ? localStorage.getItem(onboardingKey) === '1' : false;
  const showOnboarding = !!user && !loading && favoriteGame === null && !alreadyOnboarded;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <img src={hmkLogo} alt="HMK" className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(255,176,0,0.4)]" />
            <h1 className="font-display font-extrabold text-lg gradient-text tracking-wide">{t('storeName')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin/customize"
                className="p-2 rounded-full glass-card text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Customize Site"
              >
                <Settings size={14} />
              </Link>
            )}
            <NotificationBell />
            <button
              onClick={toggleLang}
              aria-label="Language"
              className="flex items-center gap-1 px-2 py-1.5 rounded-full glass-card text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe size={12} />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <Link
              to={user ? '/profile' : '/auth'}
              aria-label="Profile"
              className="w-10 h-10 rounded-full bg-muted border-2 border-primary/40 hover:border-primary transition-colors flex items-center justify-center text-foreground font-display font-bold overflow-hidden"
            >
              {user ? (user.email?.charAt(0).toUpperCase() ?? 'U') : <UserIcon size={16} />}
            </Link>
          </div>
        </div>
      </header>

      <div className="px-5 pt-6 pb-2 space-y-6 max-w-lg mx-auto">
      <div className="py-2">
        <PromoBanner />
      </div>

      <PWAInstallButton />

      <div>
        <h2 className="font-display font-extrabold text-base text-foreground mb-3">
          {lang === 'ar' ? 'شحن العاب الموبايل' : 'Mobile Game Top-up'}
        </h2>
        <GameGrid onSelectGame={(id) => navigate(`/game/${id}`)} searchQuery="" category="all" />
      </div>

      <ReviewsCarousel />

      <SocialLinks />

      <AppFooter />
      </div>

      <AnimatePresence>
        {selectedGame && (
          <CheckoutFlow gameId={selectedGame} onClose={() => setSelectedGame(null)} />
        )}
      </AnimatePresence>

      <FavoriteGameModal
        open={showOnboarding}
        dismissible
        onClose={() => {
          if (onboardingKey) localStorage.setItem(onboardingKey, '1');
        }}
        onSelect={async (id) => {
          await setFavoriteGame(id);
          if (onboardingKey) localStorage.setItem(onboardingKey, '1');
          navigate(`/game/${id}`);
        }}
      />
    </div>
  );
};

export default Index;
