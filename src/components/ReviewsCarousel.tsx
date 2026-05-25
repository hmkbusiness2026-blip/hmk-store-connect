import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface Review {
  id: string;
  customer_name: string;
  platform: string;
  review_text: string;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  const p = platform.toLowerCase();
  const common = 'w-3.5 h-3.5 flex-shrink-0';
  if (p === 'whatsapp')
    return (
      <svg viewBox="0 0 24 24" className={common} fill="#25D366">
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.1-3.6-.3-.5.3-.5.8-1.5.1-.2.1-.3 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.2 2.9c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.1-.6-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
      </svg>
    );
  if (p === 'facebook')
    return (
      <svg viewBox="0 0 24 24" className={common} fill="#1877F2">
        <path d="M22 12a10 10 0 1 0-11.6 9.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
      </svg>
    );
  if (p === 'instagram')
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="url(#igGrad)" strokeWidth="2">
        <defs>
          <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="url(#igGrad)" />
      </svg>
    );
  if (p === 'tiktok')
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor">
        <path d="M16 3v3.2c1.2.9 2.7 1.5 4.3 1.5v3.2c-1.6 0-3.1-.4-4.3-1.1V15a6 6 0 1 1-6-6v3.2A2.8 2.8 0 1 0 12.8 15V3H16z" />
      </svg>
    );
  // Website
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="hsl(var(--primary))" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
};

const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    supabase
      .from('reviews')
      .select('id, customer_name, platform, review_text')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setReviews((data as Review[]) || []));
  }, []);

  if (reviews.length === 0) return null;

  // Duplicate for seamless loop
  const loop = [...reviews, ...reviews];

  return (
    <div className="space-y-2">
      <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        {t('customerReviews')}
      </h2>
      <div className="relative overflow-hidden glass-card py-3 group">
        <div className="absolute inset-y-0 start-0 w-12 bg-gradient-to-e from-card to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 end-0 w-12 bg-gradient-to-w from-card to-transparent z-10 pointer-events-none" />
        <div className="flex gap-8 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
          {loop.map((r, i) => (
            <div key={`${r.id}-${i}`} className="flex items-center gap-2 text-xs">
              <PlatformIcon platform={r.platform} />
              <span className="font-display font-bold text-foreground">{r.customer_name}:</span>
              <span className="text-muted-foreground">"{r.review_text}"</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsCarousel;
