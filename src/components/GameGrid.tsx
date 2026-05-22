import { useEffect, useState } from 'react';
import { games } from '@/lib/gameData';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface GameGridProps {
  onSelectGame: (gameId: string) => void;
  searchQuery?: string;
  category?: string;
}

const GameGrid = ({ onSelectGame, searchQuery = '', category = 'all' }: GameGridProps) => {
  const { lang } = useLanguage();
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const keys = games.map(g => `game_img_${g.id}`);
      const { data } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', keys);
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((row: any) => {
        const id = row.key.replace('game_img_', '');
        if (row.value) map[id] = row.value;
      });
      setOverrides(map);
    })();
  }, []);

  const filtered = games.filter((game) => {
    const matchesSearch = searchQuery
      ? game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.nameAr.includes(searchQuery)
      : true;
    const matchesCategory = category === 'all' || game.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="games-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {filtered.map((game, i) => (
        <motion.button
          key={game.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelectGame(game.id)}
          className="relative overflow-hidden rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] active:scale-[0.97] hover:border-primary/40 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.4)] transition-all group"
        >
          <img
            src={overrides[game.id] || game.image}
            alt={game.name}
            loading="lazy"
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />

          {game.category === 'uid' && (
            <span className="absolute top-2 start-2 text-[9px] px-1.5 py-0.5 rounded-md bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wide">
              UID
            </span>
          )}

          <div className="absolute bottom-0 start-0 end-0 p-2.5">
            <h3 className="font-display font-bold text-xs text-foreground truncate">
              {lang === 'ar' ? game.nameAr : game.name}
            </h3>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default GameGrid;
