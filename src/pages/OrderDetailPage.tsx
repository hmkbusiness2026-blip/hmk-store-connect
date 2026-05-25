import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, ArrowRight, Star, AlertTriangle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SocialLinks from '@/components/SocialLinks';
import { WA_NUMBER } from '@/lib/validation';

interface Order {
  id: string;
  user_id: string;
  game_name: string;
  package_name: string;
  price: number;
  status: string;
  created_at: string;
  admin_name: string | null;
  player_uid: string;
  server: string;
  zone: string | null;
  payment_method: string;
}

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateOpen, setRateOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      setOrder(data as any);
      const { data: rev } = await supabase
        .from('order_reviews')
        .select('*')
        .eq('order_id', id)
        .maybeSingle();
      setExistingReview(rev);
      setLoading(false);
    })();
  }, [id, user]);

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {lang === 'ar' ? 'الطلب غير موجود' : 'Order not found'}
      </div>
    );
  }

  const dt = new Date(order.created_at);
  const dayName = dt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
  const dateStr = dt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  const timeStr = dt.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const reportUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `${lang === 'ar' ? 'مرحبا، أرغب بالإبلاغ عن مشكلة في الطلب رقم' : 'Hi, I want to report an issue with order'}: ${order.id}`
  )}`;

  const submitReview = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('order_reviews').insert({
      order_id: order.id,
      user_id: user.id,
      rating,
      body: reviewText || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: lang === 'ar' ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: lang === 'ar' ? 'تم إرسال التقييم' : 'Review submitted' });
      setRateOpen(false);
      setExistingReview({ rating, body: reviewText });
    }
  };

  const Row = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-display font-bold text-foreground text-end">{value || '—'}</span>
    </div>
  );

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 glass border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full glass-card text-foreground hover:text-primary">
            <BackIcon size={18} />
          </button>
          <h1 className="font-display font-extrabold text-base text-foreground">
            {lang === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-5 pt-4 space-y-5 max-w-lg mx-auto">
        <div className="glass-card p-4 rounded-2xl">
          <Row label={lang === 'ar' ? 'رقم الطلب' : 'Order ID'} value={order.id.slice(0, 8).toUpperCase()} />
          <Row label={lang === 'ar' ? 'ادمن الخدمة' : 'Service Admin'} value={order.admin_name} />
          <Row label={lang === 'ar' ? 'اليوم' : 'Day'} value={dayName} />
          <Row label={lang === 'ar' ? 'التاريخ' : 'Date'} value={dateStr} />
          <Row label={lang === 'ar' ? 'الوقت' : 'Time'} value={timeStr} />
          <Row label={lang === 'ar' ? 'الحالة' : 'Status'} value={order.status} />
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <h2 className="font-display font-bold text-sm text-foreground mb-2">
            {lang === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
          </h2>
          <Row label={lang === 'ar' ? 'اللعبة' : 'Game'} value={order.game_name} />
          <Row label={lang === 'ar' ? 'الباقة' : 'Package'} value={order.package_name} />
          <Row label={lang === 'ar' ? 'الايدي' : 'Player ID'} value={order.player_uid} />
          <Row label={lang === 'ar' ? 'السيرفر' : 'Server'} value={order.server} />
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-primary/30">
            <span className="text-sm font-bold text-foreground">{lang === 'ar' ? 'المبلغ المدفوع' : 'Total Paid'}</span>
            <span className="text-lg font-display font-extrabold text-primary">{order.price} EGP</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => !existingReview && setRateOpen(true)}
            disabled={!!existingReview}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            <Star size={16} />
            {existingReview
              ? (lang === 'ar' ? 'تم التقييم' : 'Rated')
              : (lang === 'ar' ? 'قيّم الخدمة' : 'Rate Service')}
          </button>
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm bg-destructive/15 text-destructive border border-destructive/40 active:scale-[0.98] transition-transform"
          >
            <AlertTriangle size={16} />
            {lang === 'ar' ? 'الابلاغ عن مشكلة' : 'Report Issue'}
          </a>
        </div>

        <SocialLinks />
      </div>

      {rateOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-lg text-foreground">
                {lang === 'ar' ? 'قيّم الخدمة' : 'Rate Service'}
              </h3>
              <button onClick={() => setRateOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star
                    size={28}
                    className={n <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
              placeholder={lang === 'ar' ? 'اكتب تقييمك...' : 'Write your review...'}
              rows={4}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <button
              onClick={submitReview}
              disabled={submitting}
              className="w-full py-2.5 rounded-md font-display font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {lang === 'ar' ? 'إرسال' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
