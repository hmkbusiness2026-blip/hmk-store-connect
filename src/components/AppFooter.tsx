import { useLanguage } from '@/contexts/LanguageContext';

const AppFooter = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border pt-4 pb-2 space-y-2 text-center">
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <a href="#" className="hover:text-primary transition-colors">{t('termsConditions')}</a>
        <span>•</span>
        <a href="#" className="hover:text-primary transition-colors">{t('privacyPolicy')}</a>
      </div>
      <p className="text-[10px] text-muted-foreground/60 font-mono">{t('copyright')}</p>
    </footer>
  );
};

export default AppFooter;
