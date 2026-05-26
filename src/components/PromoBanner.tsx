import { useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import BannersManagerDialog from '@/components/owner/BannersManagerDialog';
import bannerImg from '@/assets/mlbb-naruto-banner.jpg';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
    <div className="relative w-full">
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
        <div className="w-full min-h-[60vh] sm:min-h-[500px] flex items-center justify-center py-10 relative">
          {hasMultiple && (
            <>
              <button
                type="button"
                aria-label="السابق"
                className="promo-prev absolute start-2 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-sm border border-white/15 transition active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="التالي"
                className="promo-next absolute end-2 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-sm border border-white/15 transition active:scale-95"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <Swiper
            modules={[EffectCoverflow, Autoplay, Navigation, Pagination]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            loop={slides.length >= 3}
            speed={800}
            coverflowEffect={{
              rotate: 0,
              stretch: -40,
              depth: 300,
              modifier: 1.5,
              slideShadows: true,
            }}
            autoplay={hasMultiple ? { delay: 5000, disableOnInteraction: false } : false}
            navigation={hasMultiple ? { prevEl: '.promo-prev', nextEl: '.promo-next' } : false}
            pagination={hasMultiple ? { clickable: true, el: '.promo-pagination' } : false}
            className="!overflow-visible w-full"
            dir="ltr"
          >
            {slides.map((s, i) => (
              <SwiperSlide
                key={i}
                className="!w-[260px] sm:!w-[300px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 promo-slide"
              >
                <div className="relative w-full h-full bg-muted">
                  <img
                    src={s.img}
                    alt={`slide-${i + 1}`}
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleCta(s)}
                    className="promo-cta absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] bg-primary text-primary-foreground font-display font-bold py-3 px-6 rounded-full shadow-[0_5px_20px_rgba(255,176,0,0.4)] hover:scale-105 active:scale-95 transition-all z-50 text-center"
                  >
                    {s.btnText}
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {hasMultiple && (
        <div className="promo-pagination flex justify-center gap-1.5 mt-2" />
      )}

      {/* Coverflow CTA visibility: only active slide */}
      <style>{`
        .promo-slide .promo-cta {
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 8px);
          transition: opacity .3s ease, transform .3s ease;
        }
        .swiper-slide-active .promo-cta {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, 0);
        }
        .promo-pagination .swiper-pagination-bullet {
          background: hsl(var(--muted-foreground) / 0.4);
          opacity: 1;
          width: 6px; height: 6px;
        }
        .promo-pagination .swiper-pagination-bullet-active {
          background: hsl(var(--primary));
          width: 22px;
          border-radius: 9999px;
        }
      `}</style>

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
