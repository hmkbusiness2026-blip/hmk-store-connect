import { useState } from 'react';
import PromoBanner from '@/components/PromoBanner';
import GameGrid from '@/components/GameGrid';
import CheckoutFlow from '@/components/CheckoutFlow';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl gradient-text">HMK STORE</h1>
        {user && (
          <span className="text-xs text-muted-foreground font-mono">{user.phone}</span>
        )}
      </header>

      <PromoBanner />

      <div>
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Top Up Games
        </h2>
        <GameGrid onSelectGame={(id) => setSelectedGame(id)} />
      </div>

      <AnimatePresence>
        {selectedGame && (
          <CheckoutFlow gameId={selectedGame} onClose={() => setSelectedGame(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
