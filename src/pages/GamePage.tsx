import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, MessageCircle } from 'lucide-react';
import { games, getServersForGame } from '@/lib/gameData';
import { useLanguage } from '@/contexts/LanguageContext';
import { WA_NUMBER } from '@/lib/validation';
import PromoBanner, { type BannerScope } from '@/components/PromoBanner';

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const game = games.find((g) => g.id === gameId);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Game not found
      </div>
    );
  }

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;
  const servers = getServersForGame(game.id);
  const isHOK = game.id === 'hok';
  const bannerScope: BannerScope | null =
    game.id === 'hok' ? 'hok' : game.id === 'mlbb' ? 'mlbb' : null;

  const hokInquiryUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    'مرحبا انا ارغب بشحن لعبة honor of kings وعايز استفسر عن سيرفري'
  )}`;

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
        {bannerScope && <PromoBanner scope={bannerScope} />}

        <div>
          <h2 className="font-display font-extrabold text-base text-foreground mb-3">
            {lang === 'ar' ? 'اختر السيرفر' : 'Choose Server'}
          </h2>
          <div className={`grid gap-3 ${isHOK ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {servers.map((s) => (
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

          {isHOK && (
            <a
              href={hokInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold text-sm bg-[#25D366] text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.6)] active:scale-[0.98] transition-transform"
            >
              <MessageCircle size={18} />
              {lang === 'ar' ? 'الاستفسار عن سيرفري في اللعبة' : 'Inquire about my server'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
