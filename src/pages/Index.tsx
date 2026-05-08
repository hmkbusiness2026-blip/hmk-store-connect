import { useState } from 'react';
import { Link } from 'react-router-dom';
import PromoBanner from '@/components/PromoBanner';
import GameGrid from '@/components/GameGrid';
import CheckoutFlow from '@/components/CheckoutFlow';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import SocialLinks from '@/components/SocialLinks';
import AppFooter from '@/components/AppFooter';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence } from 'framer-motion';
import { Globe, Settings } from 'lucide-react';
import hmkLogo from '@/assets/hmk-logo.png';

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const { user, userRole } = useAuth();
  const { t, lang, toggleLang } = useLanguage();

  const isAdmin = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={hmkLogo} alt="HMK" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(255,176,0,0.4)]" />
          <h1 className="font-display font-extrabold text-xl gradient-text tracking-wide">{t('storeName')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin/customize"
              className="flex items-center gap-1 px-2 py-1 rounded-full glass-card text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Customize Site"
            >
              <Settings size={12} />
              <span className="hidden sm:inline">Customize</span>
            </Link>
          )}
          <NotificationBell />
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2 py-1 rounded-full glass-card text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe size={12} />
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          {user && (
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
              {user.email?.replace('@hmkstore.com', '')}
            </span>
          )}
        </div>
      </header>

      <PromoBanner />

      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <CategoryFilter selected={category} onChange={setCategory} />

      <div>
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          {t('topUpGames')}
        </h2>
        <GameGrid onSelectGame={(id) => setSelectedGame(id)} searchQuery={searchQuery} category={category} />
      </div>

      <ReviewsCarousel />

      <SocialLinks />

      <AppFooter />

      <AnimatePresence>
        {selectedGame && (
          <CheckoutFlow gameId={selectedGame} onClose={() => setSelectedGame(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
