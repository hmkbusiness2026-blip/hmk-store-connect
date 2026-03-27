import { useState } from 'react';
import { Crown, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';

const guides = [
  { id: '1', titleAr: 'أقل تكلفة لسكين ناروتو 1', titleEn: 'Lowest cost plan for Naruto 1 Skin' },
  { id: '2', titleAr: 'خطة سكينات ناروتو 2', titleEn: 'Naruto 2 Skins plan' },
  { id: '3', titleAr: 'خطة شاشة التحميل', titleEn: 'Loading Screen plan' },
  { id: '4', titleAr: 'خطة البرج', titleEn: 'Tower plan' },
  { id: '5', titleAr: 'أدلة الألعاب الشاملة', titleEn: 'Comprehensive game guides' },
];

const VipUnlocked = () => {
  const { lang } = useLanguage();
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const selected = guides.find((g) => g.id === selectedGuide);

  return (
    <div className="space-y-3">
      <div className="glass-card p-4 flex items-center gap-2 border-primary/30">
        <Crown size={18} className="text-accent" />
        <span className="font-display font-bold text-sm text-foreground">
          {lang === 'ar' ? 'مرحباً بك في VIP!' : 'Welcome to VIP!'}
        </span>
      </div>

      <div className="space-y-2">
        {guides.map((guide) => (
          <button
            key={guide.id}
            onClick={() => setSelectedGuide(guide.id)}
            className="w-full glass-card p-3 flex items-center justify-between hover:border-primary/30 transition-colors"
          >
            <span className="font-display font-semibold text-sm text-foreground">
              {lang === 'ar' ? guide.titleAr : guide.titleEn}
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-5 w-full max-w-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-foreground text-sm">
                  {lang === 'ar' ? selected.titleAr : selected.titleEn}
                </h3>
                <button onClick={() => setSelectedGuide(null)} className="text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'هذا المحتوى حصري لأعضاء VIP. سيتم تحديث الدليل قريباً بمعلومات مفصلة عن أفضل الخطط والاستراتيجيات.'
                  : 'This content is exclusive to VIP members. The guide will be updated soon with detailed information about the best plans and strategies.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VipUnlocked;
