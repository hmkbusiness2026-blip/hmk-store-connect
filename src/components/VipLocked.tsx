import { Crown, Lock, Gem, BookOpen, Newspaper } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';

interface VipLockedProps {
  totalDiamonds: number;
}

const VipLocked = ({ totalDiamonds }: VipLockedProps) => {
  const { t } = useLanguage();
  const progress = Math.min((totalDiamonds / 250) * 100, 100);

  return (
    <div className="space-y-4">
      <div className="glass-card p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
          <Lock size={28} className="text-accent" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">{t('vipZone')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('vipLocked')}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('vipProgress')}</span>
            <span>{totalDiamonds} / 250 {t('diamonds')}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
          <Crown size={16} className="text-accent" />
          {t('vipBenefits')}
        </h3>
        <ul className="space-y-3">
          {[
            { icon: Gem, text: t('vipBenefit1') },
            { icon: Newspaper, text: t('vipBenefit2') },
            { icon: BookOpen, text: t('vipBenefit3') },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VipLocked;
