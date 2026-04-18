import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import bannerImg from '@/assets/mlbb-naruto-banner.jpg';

const PromoBanner = () => {
  const { t } = useLanguage();
  const [imgSrc, setImgSrc] = useState<string>(bannerImg);
  const [title, setTitle] = useState<string>('MLBB x Naruto');
  const [subtitle, setSubtitle] = useState<string>(t('topUpNow'));

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', ['banner_main', 'banner_title', 'banner_subtitle']);
      if (!data) return;
      data.forEach((row: any) => {
        if (row.key === 'banner_main' && row.value) setImgSrc(row.value);
        if (row.key === 'banner_title' && row.value) setTitle(row.value);
        if (row.key === 'banner_subtitle' && row.value) setSubtitle(row.value);
      });
    })();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg glow-cyan">
      <img
        src={imgSrc}
        alt={title}
        width={1280}
        height={512}
        className="w-full h-40 sm:h-52 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      <div className="absolute bottom-3 start-3 end-3">
        <p className="text-xs font-display text-primary uppercase tracking-widest">{t('limitedEvent')}</p>
        <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};

export default PromoBanner;
