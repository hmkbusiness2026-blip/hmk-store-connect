import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import mlbbImg from '@/assets/game-mlbb.jpg';
import hokImg from '@/assets/game-hok.jpg';
import { useLanguage } from '@/contexts/LanguageContext';

interface FavoriteGameModalProps {
  open: boolean;
  onClose?: () => void;
  onSelect: (gameId: 'mlbb' | 'hok') => void;
  dismissible?: boolean;
}

const FavoriteGameModal = ({ open, onClose, onSelect, dismissible = false }: FavoriteGameModalProps) => {
  const { lang } = useLanguage();
  const choices = [
    { id: 'hok' as const, name: 'Honor of Kings', nameAr: 'هونر أوف كينجز', img: hokImg },
    { id: 'mlbb' as const, name: 'Mobile Legends', nameAr: 'موبايل ليجندز', img: mlbbImg },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            className="glass-card relative w-full max-w-sm p-5 space-y-4"
          >
            {dismissible && onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 end-3 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
            <div className="text-center space-y-1">
              <h3 className="font-display font-extrabold text-lg gradient-text">
                {lang === 'ar' ? 'اختر لعبتك المفضلة' : 'Choose Your Favorite Game'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar'
                  ? 'سيتم تخصيص زر سريع لشحن لعبتك المفضلة'
                  : 'A quick-access button will be set for your favorite game.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {choices.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className="group relative rounded-2xl overflow-hidden border border-border hover:border-primary/60 active:scale-95 transition-all"
                >
                  <img src={c.img} alt={c.name} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-2 text-center">
                    <p className="font-display font-bold text-sm text-foreground">
                      {lang === 'ar' ? c.nameAr : c.name}
                    </p>
                  </div>
                  <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-primary/60 transition-all rounded-2xl" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FavoriteGameModal;
