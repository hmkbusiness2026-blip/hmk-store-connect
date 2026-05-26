import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import BannersManagerDialog from '@/components/owner/BannersManagerDialog';
import bannerImg from '@/assets/mlbb-naruto-banner.jpg';

export type BannerScope = 'home' | 'hok' | 'mlbb';

interface Slide {
  img: string;
  link: string;
  btnText: string;
}

const SLIDE_IDS = ['1', '2', '3', '4', '5', '6', '7'];

const FIRST_TIME_FALLBACK: Record<BannerScope, { img: string } | null> = {
  home: { img: bannerImg },
  hok: null,
  mlbb: null,
};

type Suffix = 'link' | 'btn_text';

const buildKey = (scope: BannerScope, id: string, suffix?: Suffix) => {
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

const DEFAULT_BTN_TEXT = 'اشحن الآن';

const PromoBanner = ({ scope = 'home' }: PromoBannerProps) => {
  const { isOwner } = usePermissions();
  const navigate = useNavigate();

  const [images, setImages] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [btnTexts, setBtnTexts] = useState<Record<string, string>>({});
  const [managerOpen, setManagerOpen] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    (async () => {
      const keys: string[] = [];
      SLIDE_IDS.forEach((id) => {
        keys.push(buildKey(scope, id), buildKey(scope, id, 'link'), buildKey(scope, id, 'btn_text'));
      });
      const { data } = await supabase.from('site_config').select('key, value').in('key', keys);
      const imgs: Record<string, string> = {};
      const lnks: Record<string, string> = {};
      const btns: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        if (row.value == null) return;
        SLIDE_IDS.forEach((id) => {
          if (row.key === buildKey(scope, id)) imgs[id] = row.value;
          else if (row.key === buildKey(scope, id, 'link')) lnks[id] = row.value;
          else if (row.key === buildKey(scope, id, 'btn_text')) btns[id] = row.value;
        });
      });
      setImages(imgs);
      setLinks(lnks);
      setBtnTexts(btns);
    })();
  }, [scope]);

  const slides: Slide[] = useMemo(() => {
    const list: Slide[] = [];
    SLIDE_IDS.forEach((id) => {
      const img = (images[id] || '').trim();
      if (!img) return;
      list.push({
        img,
        link: (links[id] || '').trim(),
        btnText: (btnTexts[id] || '').trim() || DEFAULT_BTN_TEXT,
      });
    });
    if (list.length === 0) {
      const fb = FIRST_TIME_FALLBACK[scope];
      if (fb) list.push({ img: fb.img, link: '', btnText: DEFAULT_BTN_TEXT });
    }
    return list;
  }, [images, links, btnTexts, scope]);

  const hasMultiple = slides.length > 1;

  const [emblaRef, embla] = useEmblaCarousel({
    loop: slides.length >= 3,
    align: 'center',
    containScroll: slides.length >= 3 ? false : 'trimSnaps',
    watchDrag: hasMultiple,
  });

  // Coverflow tween — scale & dim adjacent slides based on distance from snap.
  const tween = useCallback(() => {
    if (!embla) return;
    const engine = embla.internalEngine();
    const scrollProgress = embla.scrollProgress();
    const slidesInView = embla.slidesInView();
    const slideNodes = embla.slideNodes();
    const isLoop = engine.options.loop;

    embla.scrollSnapList().forEach((snap, snapIndex) => {
      let diffToTarget = snap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];

      slidesInSnap.forEach((slideIndex) => {
        if (!slidesInView.includes(slideIndex)) return;

        if (isLoop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) diffToTarget = snap - (1 + scrollProgress);
              if (sign === 1) diffToTarget = snap + (1 - scrollProgress);
            }
          });
        }

        const dist = Math.abs(diffToTarget);
        const sign = Math.sign(diffToTarget); // <0 = slide is to the LEFT of center
        const scale = Math.max(0.78, 1 - dist * 0.32);
        const opacity = Math.max(0.35, 1 - dist * 1.1);
        const rotateY = Math.max(-35, Math.min(35, -sign * dist * 35));
        const translateX = sign * dist * 18; // px, pulls side cards inward
        const node = slideNodes[slideIndex];
        if (node) {
          node.style.transform = `perspective(1200px) translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`;
          node.style.opacity = String(opacity);
          node.style.zIndex = dist < 0.05 ? '10' : String(Math.max(1, 5 - Math.round(dist * 5)));
        }

      });
    });
  }, [embla]);


  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    onSelect();
    tween();
    embla.on('select', onSelect);
    embla.on('scroll', tween);
    embla.on('reInit', tween);
    embla.on('reInit', onSelect);
    return () => {
      embla.off('select', onSelect);
      embla.off('scroll', tween);
      embla.off('reInit', tween);
      embla.off('reInit', onSelect);
    };
  }, [embla, tween]);

  // Autoplay (10s)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAutoplay = useCallback(() => {
    if (!embla || !hasMultiple) return;
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => embla.scrollNext(), 10000);
  }, [embla, hasMultiple]);
  useEffect(() => {
    startAutoplay();
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [startAutoplay]);

  const handlePrev = () => { embla?.scrollPrev(); startAutoplay(); };
  const handleNext = () => { embla?.scrollNext(); startAutoplay(); };
  const handleDot = (i: number) => { embla?.scrollTo(i); startAutoplay(); };

  const handleCta = (slide: Slide) => {
    const link = slide.link;
    if (!link) {
      document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link.startsWith('/') ? link : `/${link}`);
    }
  };

  const currentImages: Record<string, string> = {};
  const currentLinks: Record<string, string> = {};
  const currentBtnTexts: Record<string, string> = {};
  SLIDE_IDS.forEach((id) => {
    currentImages[id] = images[id] || '';
    currentLinks[id] = links[id] || '';
    currentBtnTexts[id] = btnTexts[id] || '';
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
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden py-6" style={{ perspective: '1200px' }}>
            <div className="flex" style={{ touchAction: 'pan-y', transformStyle: 'preserve-3d' }}>
              {slides.map((s, i) => (
                <div
                  key={i}
                  className="relative shrink-0 grow-0 basis-[70%] sm:basis-[55%] md:basis-[42%] lg:basis-[32%] px-2 transition-[transform,opacity] duration-300 ease-out will-change-transform"
                  style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                >

                  <div
                    className="relative overflow-hidden rounded-2xl glow-gold aspect-[3/4] mx-auto"
                    style={{ backgroundColor: '#e5e7eb' }}
                  >
                    <img
                      src={s.img}
                      alt={`slide-${i + 1}`}
                      loading="eager"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ backgroundColor: '#e5e7eb' }}
                    />
                    {i === selected && (
                      <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                        <button
                          onClick={() => handleCta(s)}
                          className="pointer-events-auto px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-display font-extrabold uppercase tracking-wider shadow-[0_0_22px_hsl(var(--primary)/0.6)] active:scale-95 transition-transform"
                        >
                          {s.btnText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="السابق"
                className="absolute start-1 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-sm border border-white/15 transition active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="التالي"
                className="absolute end-1 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-sm border border-white/15 transition active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      )}

      {hasMultiple && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDot(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                selected === i ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40'
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
          keyForRow={(id, suffix) => buildKey(scope, id, suffix as Suffix | undefined)}
          currentImages={currentImages}
          currentLinks={currentLinks}
          currentBtnTexts={currentBtnTexts}
          defaultBtnText={DEFAULT_BTN_TEXT}
          onSavedAll={({ images: nImg, links: nLnk, btnTexts: nBtn }) => {
            setImages(nImg);
            setLinks(nLnk);
            setBtnTexts(nBtn);
          }}
        />
      )}
    </div>
  );
};

export default PromoBanner;
