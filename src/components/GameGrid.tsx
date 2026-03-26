import { games } from '@/lib/gameData';
import { motion } from 'framer-motion';

interface GameGridProps {
  onSelectGame: (gameId: string) => void;
}

const GameGrid = ({ onSelectGame }: GameGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {games.map((game, i) => (
        <motion.button
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={() => onSelectGame(game.id)}
          className={`relative overflow-hidden rounded-lg glass-card group active:scale-95 transition-transform ${
            i === games.length - 1 && games.length % 2 !== 0 ? 'col-span-2' : ''
          }`}
        >
          <img
            src={game.image}
            alt={game.name}
            loading="lazy"
            className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="font-display font-bold text-sm text-foreground truncate">{game.name}</h3>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
        </motion.button>
      ))}
    </div>
  );
};

export default GameGrid;
