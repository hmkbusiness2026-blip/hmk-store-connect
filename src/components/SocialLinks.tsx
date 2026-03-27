import { useLanguage } from '@/contexts/LanguageContext';

const socials = [
  {
    name: 'Facebook',
    nameAr: 'فيسبوك',
    url: 'https://facebook.com/hmkstore',
    color: 'bg-[#1877F2]',
    icon: '📘',
  },
  {
    name: 'WhatsApp',
    nameAr: 'واتساب',
    url: 'https://wa.me/201012345678',
    color: 'bg-[#25D366]',
    icon: '💬',
  },
  {
    name: 'Facebook Group',
    nameAr: 'جروب فيسبوك',
    url: 'https://facebook.com/groups/hmkstore',
    color: 'bg-[#1877F2]',
    icon: '👥',
  },
  {
    name: 'WhatsApp Group',
    nameAr: 'جروب واتساب',
    url: 'https://chat.whatsapp.com/hmkstore',
    color: 'bg-[#25D366]',
    icon: '📱',
    badge: true,
  },
  {
    name: 'TikTok',
    nameAr: 'تيك توك',
    url: 'https://tiktok.com/@hmkstore',
    color: 'bg-[#FF0050]',
    icon: '🎵',
  },
];

const SocialLinks = () => {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-3">
      <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        {t('socialLinks')}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card p-3 flex items-center gap-2.5 hover:border-primary/30 transition-colors relative"
          >
            <span className={`w-8 h-8 rounded-lg ${social.color} flex items-center justify-center text-sm`}>
              {social.icon}
            </span>
            <span className="font-display font-semibold text-xs text-foreground">
              {lang === 'ar' ? social.nameAr : social.name}
            </span>
            {social.badge && (
              <span className="absolute -top-1.5 end-2 text-[8px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-display font-bold">
                {t('mostRequested')}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLinks;
