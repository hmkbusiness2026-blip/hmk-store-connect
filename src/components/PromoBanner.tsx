import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
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
}

export type BannerScope = 'home' | 'hok' | 'mlbb';

// Local slide ids (1..4). Storage keys are derived per scope so each page is independent.
const SLIDE_IDS = ['1', '2', '3', '4'];

const HOME_DEFAULTS: Record<string, { img: string; title?: string }> = {
  '1': { img: bannerImg, title: 'MLBB x Naruto' },
  '2': { img: hokImg, title: 'Honor of Kings' },
  '3': { img: mlbbImg, title: 'Mobile Legends' },
};

const buildKey = (scope: BannerScope, id: string, suffix?: 'title' | 'subtitle') => {
  // Home keeps the legacy key shape used elsewhere; games use a scoped prefix.
  const base =
    scope === 'home'
      ? id === '1'
        ? 'banner_main'
        : `banner_${id}`
      : `${scope}_banner_${id}`;
  return suffix ? `${base}_${suffix}` : base;
};

interface PromoBannerProps {
  scope?: BannerScope;
}

const PromoBanner = ({ scope = 'home' }: PromoBannerProps) => {
  const { t } = useLanguage();
  const { isOwner } = usePermissions();
  const [images, setImages] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [subtitles, setSubtitles] = useState<Record<string, string>>({});
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);

  const storageKeys = useMemo(() => SLIDE_IDS.map((id) => buildKey(scope, id)), [scope]);

  useEffect(() => {
    (async () => {
      const keys: string[] = [];
      SLIDE_IDS.forEach((id) => {
        keys.push(buildKey(scope, id), buildKey(scope, id, 'title'), buildKey(scope, id, 'subtitle'));
      });
      const { data } = await supabase.from('site_config').select('key, value').in('key', keys);
      const imgs: Record<string, string> = {};
      const ttls: Record<string, string> = {};
      const subs: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        if (!row.value) return;
        SLIDE_IDS.forEach((id) => {
          if (row.key === buildKey(scope, id)) imgs[id] = row.value;
          else if (row.key === buildKey(scope, id, 'title')) ttls[id] = row.value;
          else if (row.key === buildKey(scope, id, 'subtitle')) subs[id] = row.value;
        });
      });
      setImages(imgs);
      setTitles(ttls);
      setSubtitles(subs);
    })();
  }, [scope]);

  // HARD FILTER: only slides with a non-empty image URL.
  const slides: Slide[] = useMemo(() => {
    const list: Slide[] = [];
    SLIDE_IDS.forEach((id) => {
      const fromDb = images[id];
      const fallback = scope === 'home' ? HOME_DEFAULTS[id]?.img : undefined;
      const img = (fromDb && fromDb.trim()) || (fallback && fallback.trim()) || '';
      if (!img) return;
      list.push({
        img,
        title: titles[id] ?? (scope === 'home' ? HOME_DEFAULTS[id]?.title ?? '' : ''),
        subtitle: subtitles[id] ?? '',
      });
    });
    return list;
  }, [images, titles, subtitles, scope]);

  const hasMultiple = slides.length > 1;
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = useCallback(() => {
    if (!api || !hasMultiple) return;
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => api.scrollNext(), 15000);
  }, [api, hasMultiple]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    startAutoplay();
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      api.off('select', onSelect);
    };
  }, [api, startAutoplay]);

  const handlePrev = () => { api?.scrollPrev(); startAutoplay(); };
  const handleNext = () => { api?.scrollNext(); startAutoplay(); };
  const handleDot = (i: number) => { api?.scrollTo(i); startAutoplay(); };

  const scrollToGames = () => {
    document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Maps passed to dialog use slide id as the row key; dialog persists via keyForRow.
  const currentImages: Record<string, string> = {};
  const currentTitles: Record<string, string> = {};
  const currentSubtitles: Record<string, string> = {};
  SLIDE_IDS.forEach((id) => {
    currentImages[id] = images[id] || '';
    currentTitles[id] = titles[id] || '';
    currentSubtitles[id] = subtitles[id] || '';
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
        <Carousel
          setApi={setApi}
          opts={{ loop: hasMultiple, watchDrag: hasMultiple }}
          className="overflow-hidden rounded-2xl"
        >
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
                    {scope === 'home' && (
                      <button
                        onClick={scrollToGames}
                        className="shrink-0 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-display font-extrabold uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.45)] active:scale-95 transition-transform"
                      >
                        TOP UP
                      </button>
                    )}
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
          slideKeys={SLIDE_IDS}
          keyForRow={(id, suffix) => buildKey(scope, id, suffix)}
          currentImages={currentImages}
          currentTitles={currentTitles}
          currentSubtitles={currentSubtitles}
          onSavedAll={({ images: nImg, titles: nTtl, subtitles: nSub }) => {
            setImages(nImg);
            setTitles(nTtl);
            setSubtitles(nSub);
          }}
        />
      )}
    </div>
  );
};

export default PromoBanner;
