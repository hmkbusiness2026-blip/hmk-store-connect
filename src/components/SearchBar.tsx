import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { sanitizeSearch } from '@/lib/validation';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={t('searchGames')}
        value={value}
        maxLength={60}
        onChange={(e) => onChange(sanitizeSearch(e.target.value))}
        className="w-full ps-10 pe-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
};

export default SearchBar;
