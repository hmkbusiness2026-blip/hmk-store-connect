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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
            selected === cat.id
              ? 'bg-primary text-primary-foreground glow-cyan'
              : 'glass-card text-muted-foreground hover:text-foreground'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
