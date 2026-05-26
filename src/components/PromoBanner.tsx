import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { usePermissions } from '@/hooks/usePermissions';
import BannersManagerDialog from '@/components/owner/BannersManagerDialog';
import bannerImg from '@/assets/mlbb-naruto-banner.jpg';
import hokImg from '@/assets/game-hok.jpg';
import mlbbImg from '@/assets/game-mlbb.jpg';

interface Slide {
  img: string;
  title: string;
  subtitle: string;
  tag: string;
}

const SLIDE_KEYS = ['banner_main', 'banner_2', 'banner_3'];

const PromoBanner = () => {
  const { t } = useLanguage();
  const { isOwner } = usePermissions();
  const [slides, setSlides] = useState<Slide[]>([
    { img: bannerImg, title: 'MLBB x Naruto', subtitle: t('topUpNow'), tag: t('limitedEvent') },
    { img: hokImg, title: 'Honor of Kings', subtitle: t('topUpNow'), tag: t('mostRequested') },
    { img: mlbbImg, title: 'Mobile Legends', subtitle: t('topUpNow'), tag: t('topUpGames') },
  ]);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', [...SLIDE_KEYS, 'banner_title', 'banner_subtitle']);
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((row: any) => { if (row.value) map[row.key] = row.value; });
      setSlides((prev) => {
        const next = [...prev];
        if (map.banner_main) next[0] = { ...next[0], img: map.banner_main };
        if (map.banner_title) next[0] = { ...next[0], title: map.banner_title };
        if (map.banner_subtitle) next[0] = { ...next[0], subtitle: map.banner_subtitle };
        if (map.banner_2) next[1] = { ...next[1], img: map.banner_2 };
        if (map.banner_3) next[2] = { ...next[2], img: map.banner_3 };
        return next;
      });
    })();
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    const id = setInterval(() => api.scrollNext(), 5000);
    return () => { clearInterval(id); api.off('select', onSelect); };
  }, [api]);

  const scrollToGames = () => {
    document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentImages: Record<string, string> = {
    banner_main: slides[0]?.img || '',
    banner_2: slides[1]?.img || '',
    banner_3: slides[2]?.img || '',
  };

  return (
    <div className="relative">
      {isOwner && (
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          className="absolute top-2 end-2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground border border-primary/40 text-[11px] font-display font-bold shadow-[0_0_14px_hsl(var(--primary)/0.55)] hover:brightness-110 active:scale-95 transition"
        >
          <Pencil size={12} />
          تعديل البانرات
        </button>
      )}

      <Carousel setApi={setApi} opts={{ loop: true }} className="overflow-hidden rounded-2xl">
        <CarouselContent>
          {slides.map((s, i) => (
            <CarouselItem key={i}>
              <div className="relative overflow-hidden rounded-2xl glow-gold">
                <img
                  src={s.img}
                  alt={s.title}
                  width={1280}
                  height={512}
                  className="w-full h-44 sm:h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                <div className="absolute bottom-4 start-4 end-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-display text-primary uppercase tracking-widest">{s.tag}</p>
                    <h2 className="text-xl font-display font-extrabold text-foreground truncate">{s.title}</h2>
                    <p className="text-xs text-muted-foreground truncate">{s.subtitle}</p>
                  </div>
                  <button
                    onClick={scrollToGames}
                    className="shrink-0 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-display font-extrabold uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.45)] active:scale-95 transition-transform"
                  >
                    TOP UP
                  </button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="flex justify-center gap-1.5 mt-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              current === i ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40'
            }`}
          />
        ))}
      </div>

      {isOwner && (
        <BannersManagerDialog
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
          slideKeys={SLIDE_KEYS}
          currentImages={currentImages}
          onSavedAll={(next) => {
            setSlides((prev) => {
              const updated = [...prev];
              SLIDE_KEYS.forEach((k, i) => {
                if (next[k] !== undefined && updated[i]) {
                  updated[i] = { ...updated[i], img: next[k] };
                }
              });
              return updated;
            });
          }}
        />
      )}
    </div>
  );
};

export default PromoBanner;
