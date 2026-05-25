import { useLanguage } from '@/contexts/LanguageContext';

const socials = [
  {
    name: 'WhatsApp',
    url: 'https://wa.me/201012345678',
    color: '#25D366',
    svg: (
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.1-3.6-.3-.5.3-.5.8-1.5.1-.2.1-.3 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.2 2.9c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.1-.6-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    ),
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com/hmkstore',
    color: '#1877F2',
    svg: (
      <path d="M22 12a10 10 0 1 0-11.6 9.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
    ),
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/hmkstore',
    color: '#E1306C',
    svg: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" />
      </>
    ),
  },
  {
    name: 'TikTok',
    url: 'https://tiktok.com/@hmkstore',
    color: '#FF0050',
    svg: (
      <path d="M16 3v3.2c1.2.9 2.7 1.5 4.3 1.5v3.2c-1.6 0-3.1-.4-4.3-1.1V15a6 6 0 1 1-6-6v3.2A2.8 2.8 0 1 0 12.8 15V3H16z" />
    ),
  },
];

const SocialLinks = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground text-center">
        {t('socialLinks')}
      </h2>
      <div className="flex items-center justify-center gap-5">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.name}
            className="group relative w-11 h-11 rounded-full flex items-center justify-center border border-border bg-card/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-transparent"
            style={{ ['--social-color' as any]: s.color }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-[var(--social-color)]"
              fill="currentColor"
            >
              {s.svg}
            </svg>
            <span
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                boxShadow: `0 0 18px 2px ${s.color}, 0 0 4px ${s.color} inset`,
              }}
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLinks;
