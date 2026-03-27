import { games } from '@/lib/gameData';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface GameGridProps {
  onSelectGame: (gameId: string) => void;
  searchQuery?: string;
  category?: string;
}

const GameGrid = ({ onSelectGame, searchQuery = '', category = 'all' }: GameGridProps) => {
  const { lang } = useLanguage();

  const filtered = games.filter((game) => {
    const matchesSearch = searchQuery
      ? game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.nameAr.includes(searchQuery)
      : true;
    const matchesCategory = category === 'all' || game.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {filtered.map((game, i) => (
        <motion.button
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          onClick={() => onSelectGame(game.id)}
          className="relative overflow-hidden rounded-lg glass-card group active:scale-95 transition-transform"
        >
          <img
            src={game.image}
            alt={game.name}
            loading="lazy"
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* UID Badge */}
          {game.category === 'uid' && (
            <span className="absolute bottom-8 start-1.5 text-[9px] px-1.5 py-0.5 rounded bg-[#22C55E] text-white font-display font-bold uppercase">
              UID
            </span>
          )}

          <div className="absolute bottom-0 start-0 end-0 p-2">
            <h3 className="font-display font-bold text-[11px] text-foreground truncate">
              {lang === 'ar' ? game.nameAr : game.name}
            </h3>
          </div>

          <div className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
        </motion.button>
      ))}
    </div>
  );
};

export default GameGrid;
