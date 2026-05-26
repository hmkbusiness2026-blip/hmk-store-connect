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
  tag?: string;
}

const SLIDE_KEYS = ['banner_main', 'banner_2', 'banner_3', 'banner_4'];

const DEFAULTS: Record<string, Slide> = {
  banner_main: { img: bannerImg, title: 'MLBB x Naruto', subtitle: '', tag: '' },
  banner_2: { img: hokImg, title: 'Honor of Kings', subtitle: '', tag: '' },
  banner_3: { img: mlbbImg, title: 'Mobile Legends', subtitle: '', tag: '' },
};

const PromoBanner = () => {
  const { t } = useLanguage();
  const { isOwner } = usePermissions();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [subtitles, setSubtitles] = useState<Record<string, string>>({});
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);

  const buildSlides = (
    imgs: Record<string, string>,
    ttls: Record<string, string>,
    subs: Record<string, string>,
  ): Slide[] => {
    const out: Slide[] = [];
    SLIDE_KEYS.forEach((k) => {
      const img = imgs[k] || DEFAULTS[k]?.img || '';
      if (!img) return;
      out.push({
        img,
        title: ttls[k] ?? DEFAULTS[k]?.title ?? '',
        subtitle: subs[k] ?? DEFAULTS[k]?.subtitle ?? t('topUpNow'),
      });
    });
    return out;
  };

  useEffect(() => {
    (async () => {
      const keys: string[] = [];
      SLIDE_KEYS.forEach((k) => { keys.push(k, `${k}_title`, `${k}_subtitle`); });
      const { data } = await supabase.from('site_config').select('key, value').in('key', keys);
      const imgs: Record<string, string> = {};
      const ttls: Record<string, string> = {};
      const subs: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        if (!row.value) return;
        if (row.key.endsWith('_title')) ttls[row.key.replace('_title', '')] = row.value;
        else if (row.key.endsWith('_subtitle')) subs[row.key.replace('_subtitle', '')] = row.value;
        else imgs[row.key] = row.value;
      });
      setImages(imgs);
      setTitles(ttls);
      setSubtitles(subs);
      setSlides(buildSlides(imgs, ttls, subs));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasMultiple = slides.length > 1;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    if (!hasMultiple) return () => api.off('select', onSelect);
    const id = setInterval(() => api.scrollNext(), 5000);
    return () => { clearInterval(id); api.off('select', onSelect); };
  }, [api, hasMultiple]);

  const scrollToGames = () => {
    document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Build maps for dialog including all keys (so owner can add empty slots)
  const currentImages: Record<string, string> = {};
  const currentTitles: Record<string, string> = {};
  const currentSubtitles: Record<string, string> = {};
  SLIDE_KEYS.forEach((k) => {
    currentImages[k] = images[k] || '';
    currentTitles[k] = titles[k] || '';
    currentSubtitles[k] = subtitles[k] || '';
  });

  if (slides.length === 0 && !isOwner) return null;

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

      {slides.length > 0 && (
        <Carousel setApi={setApi} opts={{ loop: hasMultiple, watchDrag: hasMultiple }} className="overflow-hidden rounded-2xl">
          <CarouselContent>
            {slides.map((s, i) => (
              <CarouselItem key={i}>
                <div className="relative overflow-hidden rounded-2xl glow-gold">
                  <img
                    src={s.img}
                    alt={s.title || `slide-${i + 1}`}
                    width={1280}
                    height={512}
                    className="w-full h-44 sm:h-56 object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                  <div className="absolute bottom-4 start-4 end-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      {s.title && (
                        <h2 className="text-xl font-display font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] truncate">
                          {s.title}
                        </h2>
                      )}
                      {s.subtitle && (
                        <p className="text-xs text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] truncate">
                          {s.subtitle}
                        </p>
                      )}
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
      )}

      {hasMultiple && (
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
      )}

      {isOwner && (
        <BannersManagerDialog
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
          slideKeys={SLIDE_KEYS}
          currentImages={currentImages}
          currentTitles={currentTitles}
          currentSubtitles={currentSubtitles}
          onSavedAll={({ images: nImg, titles: nTtl, subtitles: nSub }) => {
            setImages(nImg);
            setTitles(nTtl);
            setSubtitles(nSub);
            setSlides(buildSlides(nImg, nTtl, nSub));
          }}
        />
      )}
    </div>
  );
};

export default PromoBanner;
