import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { games, arabicServers } from '@/lib/gameData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import bannerImg from '@/assets/mlbb-naruto-banner.jpg';
import hokImg from '@/assets/game-hok.jpg';
import mlbbImg from '@/assets/game-mlbb.jpg';

const slidesPool = [bannerImg, hokImg, mlbbImg, bannerImg];

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const game = games.find((g) => g.id === gameId);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    const id = setInterval(() => api.scrollNext(), 5000);
    return () => { clearInterval(id); api.off('select', onSelect); };
  }, [api]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Game not found
      </div>
    );
  }

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 glass border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full glass-card text-foreground hover:text-primary transition-colors"
            aria-label="Back"
          >
            <BackIcon size={18} />
          </button>
          <h1 className="font-display font-extrabold text-base text-foreground">
            {lang === 'ar' ? game.nameAr : game.name}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-5 pt-4 space-y-6 max-w-lg mx-auto">
        {/* Carousel with arrows */}
        <div className="relative">
          <Carousel setApi={setApi} opts={{ loop: true }} className="overflow-hidden rounded-2xl">
            <CarouselContent>
              {slidesPool.map((img, i) => (
                <CarouselItem key={i}>
                  <div className="relative overflow-hidden rounded-2xl">
                    <img src={img} alt={`slide-${i}`} className="w-full h-44 sm:h-56 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <button
            onClick={() => api?.scrollPrev()}
            className="absolute start-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>

          <div className="flex justify-center gap-1.5 mt-2">
            {slidesPool.map((_, i) => (
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
        </div>

        {/* Server selection */}
        <div>
          <h2 className="font-display font-extrabold text-base text-foreground mb-3">
            {lang === 'ar' ? 'اختر السيرفر' : 'Choose Server'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {arabicServers.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/game/${game.id}/${s.id}`)}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl glass-card border border-border hover:border-primary/60 hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.5)] active:scale-[0.97] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Globe size={22} />
                </div>
                <span className="font-display font-bold text-sm text-foreground">
                  {lang === 'ar' ? s.labelAr : s.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
