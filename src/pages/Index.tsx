import { useState } from 'react';
import PromoBanner from '@/components/PromoBanner';
import GameGrid from '@/components/GameGrid';
import CheckoutFlow from '@/components/CheckoutFlow';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import SocialLinks from '@/components/SocialLinks';
import AppFooter from '@/components/AppFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const { user } = useAuth();
  const { t, lang, toggleLang } = useLanguage();

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl gradient-text">{t('storeName')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2 py-1 rounded-full glass-card text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe size={12} />
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          {user && (
            <span className="text-xs text-muted-foreground font-mono">
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
