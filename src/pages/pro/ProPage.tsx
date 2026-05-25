import { useNavigate } from 'react-router-dom';
import { Crown, BookOpen, Smile, Trophy } from 'lucide-react';
import { useProStatus } from '@/hooks/useProStatus';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const faqItems = [
  {
    q: 'كم تستمر العضوية بحسابي ؟',
    a: 'تستمر العضوية بحد أدنى 60 يوم بحسابك، ولتجديدها تحتاج تشحن بـ 250 جنيه أو أكثر خلال الـ 60 يوم نفسها أو بعدها.',
  },
  {
    q: 'هل يمكن الحصول على فترة أطول بالعضوية ؟',
    a: 'نعم، خلال الـ 60 يوم لو شحنت بأكثر من 5,000 جنيه تحصل على 90 يوم عضوية تتجدد تلقائياً عند نهايتها لـ 60 يوم إضافية. وعند شحن بقيمة 10,000 جنيه أو أكثر تحصل على 180 يوم عضوية تتجدد تلقائياً عند نهايتها لـ 90 يوم إضافية.',
  },
  {
    q: 'هل يمكن أن تسحب مني العضوية ؟',
    a: 'العضوية حصرية للعملاء اللي حققوا الشروط، بالتالي لو حد حاول نشر المعلومات والمزايا اللي بداخلها بشكل علني أو جرب يبيع محتوياتها، فيحق لـ HMK Store سحبها من اللي قام بهذا الأمر.',
  },
  {
    q: 'هل في مزايا جديدة هتنزل للعضوية ؟',
    a: 'أه، فريقنا شغال يطور العضوية وبدون شروط إضافية للعملاء اللي مفعلينها بالفعل، ولسه في كتير جاي بالطريق.',
  },
];

const ProPage = () => {
  const navigate = useNavigate();
  const { status, loading } = useProStatus();

  if (loading) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-6 text-center text-muted-foreground bg-[#0B0F19]">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto space-y-6 ${
        !status.is_pro ? 'bg-[#0B0F19]' : ''
      }`}
      dir="rtl"
    >
      {/* Page Header — always visible */}
      <div className="flex items-center gap-2">
        <Crown size={22} className="text-accent" />
        <h1 className="font-display font-bold text-lg text-foreground">
          العضوية المميزة PRO
        </h1>
      </div>

      {status.is_pro ? (
        <>
          <div className="glass-card p-5 text-center space-y-3 border-accent/40">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_28px_hsl(var(--primary)/0.55)]">
              <Crown size={28} className="text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl gradient-text">
              PRO {status.tier.toUpperCase()}
            </h2>
            <div className="text-sm text-muted-foreground">
              المدة المتبقية:{' '}
              <span className="font-bold text-foreground">
                {status.days_remaining} يوم
              </span>
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
                <span className="font-display font-semibold text-sm text-foreground flex-1 text-right">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-8">
          {/* ====== HERO SECTION ====== */}
          <div className="text-center space-y-5 pt-2">
            {/* Glowing Crown */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 animate-pulse-gold" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/10 to-transparent animate-pulse-gold" style={{ animationDelay: '0.7s' }} />
              <div className="relative w-20 h-20 rounded-full gradient-fire flex items-center justify-center animate-float shadow-[0_0_30px_rgba(255,176,0,0.4)]">
                <Crown size={40} className="text-white drop-shadow-lg" />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-display font-extrabold text-3xl gradient-text text-glow-gold leading-tight">
              PRO العضوية المميزة
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              اشحن بقيمة 250 ج.م أو أكثر لفتح العضوية المميزة
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full max-w-xs mx-auto h-14 rounded-xl gradient-fire text-white font-display font-bold text-lg
                shadow-lg transition-all duration-300
                hover:shadow-[0_0_40px_rgba(255,176,0,0.5)] hover:scale-[1.03] hover:brightness-110
                active:scale-[0.97] animate-pulse-gold"
            >
              اشحن الآن
            </button>
          </div>

          {/* ====== BENEFITS SECTION ====== */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              مزايا PRO
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  icon: BookOpen,
                  text: 'جداول أقل تكلفة للسكن والأحداث الجاية',
                },
                {
                  icon: Smile,
                  text: 'أكواد إيموتات حصرية',
                },
                {
                  icon: Trophy,
                  text: 'مسابقات حصرية',
                },
              ].map(({ icon: Icon, text }, i) => (
                <div
                  key={i}
                  className="glass-card p-5 flex items-center gap-4
                    transition-all duration-300
                    hover:border-primary/40
                    hover:shadow-[0_0_24px_rgba(255,176,0,0.12)]
                    group"
                >
                  <div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/15
                      flex items-center justify-center flex-shrink-0
                      group-hover:shadow-[0_0_20px_rgba(255,176,0,0.35)]
                      transition-shadow duration-300"
                  >
                    <Icon
                      size={24}
                      className="text-primary group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-sm text-foreground font-semibold leading-relaxed">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ====== FAQ SECTION ====== */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-xs text-primary font-bold">
                ؟
              </span>
              الأسئلة الشائعة
            </h3>

            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="glass-card border-none px-4 overflow-hidden transition-all duration-300 hover:border-primary/30"
                >
                  <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-4 gap-3 [&>svg]:text-primary">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-[1.8] pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProPage;
