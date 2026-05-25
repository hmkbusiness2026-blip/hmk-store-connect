import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallButton = () => {
  const { lang } = useLanguage();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore iOS
      window.navigator.standalone === true;
    if (isStandalone) setInstalled(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferred(null);
    } else if (isIOS) {
      setShowIOSHint(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl glass-card border border-primary/40 text-foreground hover:border-primary hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)] transition-all"
      >
        <Download size={16} className="text-primary" />
        <span className="font-display font-bold text-sm">
          {lang === 'ar' ? 'إضافة للشاشة الرئيسية' : 'Add to Home Screen'}
        </span>
      </button>

      {showIOSHint && (
        <div
          className="fixed inset-0 z-[70] bg-background/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSHint(false)}
        >
          <div
            className="glass-card relative w-full max-w-sm p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSHint(false)}
              className="absolute top-3 end-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h3 className="font-display font-extrabold text-base gradient-text">
              {lang === 'ar' ? 'التثبيت على iOS' : 'Install on iOS'}
            </h3>
            <ol className="text-sm text-foreground space-y-2 list-decimal ps-5">
              <li className="flex items-center gap-2">
                <Share size={14} className="text-primary" />
                {lang === 'ar' ? 'اضغط زر المشاركة في Safari' : 'Tap the Share button in Safari'}
              </li>
              <li>{lang === 'ar' ? 'اختر "أضف إلى الشاشة الرئيسية"' : 'Choose "Add to Home Screen"'}</li>
              <li>{lang === 'ar' ? 'اضغط "إضافة" في الأعلى' : 'Tap "Add" at the top'}</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
