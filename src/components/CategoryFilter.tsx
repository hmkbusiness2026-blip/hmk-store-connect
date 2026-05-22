import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

const CategoryFilter = ({ selected, onChange }: CategoryFilterProps) => {
  const { t } = useLanguage();

  const categories = [
    { id: 'all', label: t('allGames') },
    { id: 'uid', label: t('uidGame') },
    { id: 'login', label: t('loginGame') },
    { id: 'other', label: t('other') },
  ];

  return (
    <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide border-b border-border/40">
      {categories.map((cat) => {
        const active = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`relative whitespace-nowrap pb-2 text-sm font-display font-semibold transition-colors ${
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            {cat.label}
            {active && (
              <motion.span
                layoutId="cat-underline"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
