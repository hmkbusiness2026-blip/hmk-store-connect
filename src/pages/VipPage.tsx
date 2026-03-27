import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import VipWatermark from '@/components/VipWatermark';
import VipLocked from '@/components/VipLocked';
import VipUnlocked from '@/components/VipUnlocked';
import { Crown } from 'lucide-react';

const VipPage = () => {
  const { phoneNumber, totalDiamonds } = useAuth();
  const { t } = useLanguage();
  const isVip = totalDiamonds >= 250;

  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    document.addEventListener('dragstart', handler);
    return () => {
      document.removeEventListener('contextmenu', handler);
      document.removeEventListener('dragstart', handler);
    };
  }, []);

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 no-select relative">
      {isVip && <VipWatermark phone={phoneNumber || ''} />}

      <div className="flex items-center gap-2 mb-4">
        <Crown size={20} className="text-accent" />
        <h1 className="font-display font-bold text-lg text-foreground">{t('vipZone')}</h1>
      </div>

      {isVip ? <VipUnlocked /> : <VipLocked totalDiamonds={totalDiamonds} />}
    </div>
  );
};

export default VipPage;
