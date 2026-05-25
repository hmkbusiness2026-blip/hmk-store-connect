import { useNavigate } from 'react-router-dom';
import { Crown, Lock, BookOpen, Smile, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useProStatus } from '@/hooks/useProStatus';

const ProPage = () => {
  const navigate = useNavigate();
  const { status, loading } = useProStatus();

  if (loading) {
    return <div className="min-h-screen pb-20 px-4 pt-6 text-center text-muted-foreground">...</div>;
  }

  const nextThreshold = status.total_spent >= 5000 ? 10000 : status.total_spent >= 250 ? 5000 : 250;
  const progress = Math.min((status.total_spent / nextThreshold) * 100, 100);

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Crown size={22} className="text-accent" />
        <h1 className="font-display font-bold text-lg text-foreground">العضوية المميزة PRO</h1>
      </div>

      {status.is_pro ? (
        <>
          <div className="glass-card p-5 text-center space-y-3 border-accent/40">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_28px_hsl(var(--primary)/0.55)]">
              <Crown size={28} className="text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl gradient-text">PRO {status.tier.toUpperCase()}</h2>
            <div className="text-sm text-muted-foreground">
              المدة المتبقية: <span className="font-bold text-foreground">{status.days_remaining} يوم</span>
            </div>
            <div className="text-xs text-muted-foreground">
              إجمالي الإنفاق: {Math.round(status.total_spent)} ج.م
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'جداول الأحداث', icon: BookOpen, path: '/pro/articles' },
              { label: 'أكواد الإيموتات', icon: Smile, path: '/pro/emotes' },
              { label: 'المسابقات', icon: Trophy, path: '/pro/competitions' },
            ].map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full glass-card p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <span className="font-display font-semibold text-sm text-foreground flex-1 text-right">{label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="glass-card p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
              <Lock size={28} className="text-accent" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">PRO مغلق</h2>
              <p className="text-sm text-muted-foreground mt-1">
                اشحن بقيمة 250 ج.م أو أكثر لفتح العضوية المميزة
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>التقدم</span>
                <span>{Math.round(status.total_spent)} / {nextThreshold} ج.م</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="glass-card p-4 space-y-3">
            <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Crown size={16} className="text-accent" />
              مزايا PRO
            </h3>
            <ul className="space-y-3">
              {[
                { icon: BookOpen, text: 'جداول أقل تكلفة للسكن والأحداث الجاية' },
                { icon: Smile, text: 'أكواد إيموتات حصرية' },
                { icon: Trophy, text: 'مسابقات حصرية' },
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

          <div className="glass-card p-3 text-xs text-muted-foreground leading-relaxed">
            <p>• 250 ج.م → PRO لمدة 60 يوم</p>
            <p>• 5,000 ج.م → PRO لمدة 90 يوم</p>
            <p>• 10,000 ج.م → PRO لمدة 180 يوم</p>
          </div>
        </>
      )}
    </div>
  );
};

export default ProPage;
