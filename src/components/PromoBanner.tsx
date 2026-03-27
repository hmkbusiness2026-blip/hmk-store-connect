import { useLanguage } from '@/contexts/LanguageContext';
import bannerImg from '@/assets/mlbb-naruto-banner.jpg';

const PromoBanner = () => {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-lg glow-cyan">
      <img
        src={bannerImg}
        alt="MLBB x Naruto Event"
        width={1280}
        height={512}
        className="w-full h-40 sm:h-52 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      <div className="absolute bottom-3 start-3 end-3">
        <p className="text-xs font-display text-primary uppercase tracking-widest">{t('limitedEvent')}</p>
        <h2 className="text-lg font-display font-bold text-foreground">MLBB x Naruto</h2>
        <p className="text-xs text-muted-foreground">{t('topUpNow')}</p>
      </div>
    </div>
  );
};

export default PromoBanner;
