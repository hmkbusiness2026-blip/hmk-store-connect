import { useEffect, useState } from 'react';
import { Download, Share, X, MoreVertical } from 'lucide-react';
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
  const [showAndroidHint, setShowAndroidHint] = useState(false);

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
    const installedHandler = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (installed) return null;

  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);

  const handleClick = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === 'accepted') setInstalled(true);
        setDeferred(null);
        return;
      } catch {
        // fall through to fallback modal
      }
    }
    if (isIOS) {
      setShowIOSHint(true);
    } else {
      // Android (or desktop Chrome without prompt available) fallback
      setShowAndroidHint(true);
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

      {showAndroidHint && (
        <div
          className="fixed inset-0 z-[70] bg-background/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowAndroidHint(false)}
        >
          <div
            className="glass-card relative w-full max-w-sm p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAndroidHint(false)}
              className="absolute top-3 end-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h3 className="font-display font-extrabold text-base gradient-text flex items-center gap-2">
              <MoreVertical size={18} className="text-primary" />
              {lang === 'ar' ? 'التثبيت على أندرويد' : 'Install on Android'}
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {lang === 'ar'
                ? "لإضافة المتجر للشاشة الرئيسية: اضغط على علامة الثلاث نقاط (⋮) في أعلى المتصفح، ثم اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home screen)."
                : "To add the store to your home screen: tap the three-dots menu (⋮) at the top of the browser, then choose 'Add to Home screen'."}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
