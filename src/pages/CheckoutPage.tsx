import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock, Copy, Loader2, Upload, Wallet, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStoreOnDuty } from '@/hooks/useStoreOnDuty';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  diamonds?: number;
}

interface CheckoutState {
  gameId: string;
  gameName: string;
  serverId: string;
  serverLabel: string;
  playerId: string;
  serverNum: string;
  items: CartItem[];
  total: number;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const { onDuty, activeAdmin } = useStoreOnDuty();
  const state = location.state as CheckoutState | null;

  const [method, setMethod] = useState<'wallet' | 'instapay' | ''>('');
  const [revealed, setRevealed] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [last3, setLast3] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) navigate('/', { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  const transferNumber = method === 'wallet' ? activeAdmin?.vodafone_cash : activeAdmin?.instapay_id;
  const adminName = activeAdmin?.full_name || (lang === 'ar' ? 'الادمن المناوب' : 'On-Duty Admin');

  const requestTransfer = async () => {
    setLoadingAdmin(true);
    await new Promise((r) => setTimeout(r, 800));
    setRevealed(true);
    setLoadingAdmin(false);
  };

  const canSubmit = revealed && !!transferNumber && !!receiptFile && last3.trim().length === 3 && !submitting && onDuty === true;

  const handleSubmit = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!canSubmit || !receiptFile || !transferNumber) return;
    setSubmitting(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);
      if (uploadErr) throw uploadErr;

      const rows = state.items.map((item) => ({
        user_id: user.id,
        game_id: state.gameId,
        game_name: state.gameName,
        server: state.serverLabel,
        player_uid: state.playerId,
        zone: state.serverNum,
        package_name: `${item.name} × ${item.qty}`,
        price: item.price * item.qty,
        payment_method: method,
        admin_name: adminName,
        receipt_url: fileName,
        status: 'pending',
      }));

      const { error: orderErr } = await supabase.from('orders').insert(rows);
      if (orderErr) throw orderErr;

      toast({
        title: lang === 'ar' ? 'تم إرسال الطلب' : 'Order submitted!',
        description: lang === 'ar' ? `آخر 3 أرقام: ${last3}` : `Last 3 digits: ${last3}`,
      });
      navigate('/orders');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 glass border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full glass-card text-foreground hover:text-primary transition-colors"
            aria-label="Back"
          >
            <BackIcon size={18} />
          </button>
          <h1 className="font-display font-extrabold text-base text-foreground">
            {lang === 'ar' ? 'الدفع' : 'Checkout'}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-5 pt-4 space-y-5 max-w-lg mx-auto">
        {onDuty === false && (
          <div className="glass-card p-4 rounded-2xl border border-destructive/40 flex items-start gap-3">
            <Clock className="text-destructive shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <p className="font-display font-extrabold text-sm text-destructive">
                {lang === 'ar' ? 'نحن خارج أوقات العمل حالياً' : 'We are currently off-duty'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'مواعيد العمل: 10 صباحاً - 2 منتصف الليل' : 'Working hours: 10 AM – 2 AM'}
              </p>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <h2 className="font-display font-extrabold text-sm text-foreground">
            {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
          </h2>
          <div className="space-y-2">
            {state.items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {i.name} <span className="text-muted-foreground">× {i.qty}</span>
                </span>
                <span className="font-display font-bold text-foreground">{i.price * i.qty} EGP</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === 'ar' ? 'الايدي' : 'Player ID'}</span>
              <span className="text-foreground font-mono">{state.playerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === 'ar' ? 'السيرفر' : 'Server'}</span>
              <span className="text-foreground font-mono">{state.serverNum}</span>
            </div>
          </div>
          <div className="border-t border-border pt-2 flex justify-between items-center">
            <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">
              {lang === 'ar' ? 'الإجمالي' : 'Total'}
            </span>
            <span className="font-display font-extrabold text-lg text-primary">{state.total} EGP</span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h3 className="font-display font-bold text-sm text-foreground mb-2">
            {lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'wallet', label: lang === 'ar' ? 'محفظة' : 'Wallet', icon: Wallet },
              { id: 'instapay', label: lang === 'ar' ? 'انستا باي' : 'InstaPay', icon: Smartphone },
            ] as const).map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setAssignedAdmin(null); }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    active
                      ? 'border-primary bg-primary/15 text-primary shadow-[0_0_18px_-6px_hsl(var(--primary)/0.6)]'
                      : 'border-border glass-card text-foreground hover:border-primary/40'
                  }`}
                >
                  <Icon size={16} />
                  <span className="font-display font-bold text-sm">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic transfer flow */}
        {method && !revealed && onDuty !== false && (
          <button
            onClick={requestTransfer}
            disabled={loadingAdmin || !transferNumber}
            className="w-full py-3 rounded-full font-display font-bold text-sm bg-secondary text-secondary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingAdmin ? (
              <><Loader2 size={16} className="animate-spin" /> {lang === 'ar' ? 'جار البحث...' : 'Searching...'}</>
            ) : (
              lang === 'ar' ? 'اطلب رقم التحويل' : 'Request Transfer Number'
            )}
          </button>
        )}

        {revealed && transferNumber && (
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-xs font-display uppercase tracking-wider text-muted-foreground">
              {lang === 'ar' ? 'رقم ادمن المناوب' : 'On-Duty Admin Number'}
            </p>
            <p className="font-display font-bold text-foreground">{adminName}</p>
            <div className="flex items-center gap-2">
              <p className="text-primary font-mono text-base">{transferNumber}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(transferNumber);
                  toast({ title: lang === 'ar' ? 'تم النسخ' : 'Copied!' });
                }}
                className="text-muted-foreground hover:text-primary"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        )}

        {revealed && transferNumber && (
          <>
            <div>
              <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                {lang === 'ar' ? 'رفع ايصال التحويل' : 'Upload Transfer Receipt'}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-muted-foreground"
              >
                {receiptFile ? (
                  <><Check size={20} className="text-primary" /><span className="text-xs text-foreground">{receiptFile.name}</span></>
                ) : (
                  <><Upload size={20} /><span className="text-xs">{lang === 'ar' ? 'اضغط لرفع الصورة' : 'Tap to upload'}</span></>
                )}
              </button>
            </div>

            <div>
              <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                {lang === 'ar' ? 'اخر 3 ارقام من التحويل' : 'Last 3 digits of transfer'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                placeholder="123"
                value={last3}
                onChange={(e) => setLast3(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-full px-3 py-3 rounded-md bg-muted border border-border text-foreground text-center text-lg font-mono tracking-[0.4em] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        )}

        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-full font-display font-extrabold text-sm bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {submitting ? <><Loader2 size={16} className="animate-spin" /> {lang === 'ar' ? 'جار الإرسال...' : 'Submitting...'}</> : (lang === 'ar' ? 'اكمال السداد' : 'Complete Payment')}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
