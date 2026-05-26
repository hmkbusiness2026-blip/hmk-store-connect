import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Loader2, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { onlyDigits, sanitizePassword, isValidPassword, isWeakPassword } from '@/lib/validation';
import hmkLogo from '@/assets/hmk-logo.png';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePhoneChange = (v: string) => setPhone(onlyDigits(v));

  const handlePasswordChange = (v: string) => {
    const cleaned = sanitizePassword(v);
    setPassword(cleaned);
    if (v !== cleaned) {
      setPwError(lang === 'ar'
        ? 'الرموز غير مسموح بها. الحد الأقصى 14 حرف ورقم.'
        : 'Symbols are not allowed. Max 14 letters/numbers.');
    } else {
      setPwError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;

    if (!isValidPassword(password)) {
      const msg = lang === 'ar'
        ? 'الرموز غير مسموح بها. الحد الأقصى 14 حرف ورقم.'
        : 'Symbols are not allowed. Max 14 letters/numbers.';
      setPwError(msg);
      toast({ title: t('error'), description: msg, variant: 'destructive' });
      return;
    }

    setLoading(true);

    // For LOGIN paths, enforce lockout
    if (isLogin || isStaffMode) {
      const { data: lockData } = await supabase.rpc('check_login_lock', { _phone: phone });
      const lock = Array.isArray(lockData) ? lockData[0] : lockData;
      if (lock?.locked) {
        const hrs = lock.hours_remaining ?? 24;
        setLoading(false);
        toast({
          title: t('error'),
          description: lang === 'ar'
            ? `تم قفل تسجيل الدخول مؤقتاً. حاول بعد ${hrs} ساعة.`
            : `Login locked. Try again in ${hrs} hours.`,
          variant: 'destructive',
        });
        return;
      }
    }

    const { error } = isLogin || isStaffMode
      ? await signIn(phone, password)
      : await signUp(phone, password);

    if (error) {
      if (isLogin || isStaffMode) {
        const { data: rl } = await supabase.rpc('record_failed_login', { _phone: phone });
        const r = Array.isArray(rl) ? rl[0] : rl;
        if (r?.locked) {
          setLoading(false);
          toast({
            title: t('error'),
            description: lang === 'ar'
              ? `تم تجاوز عدد المحاولات. القفل لمدة ${r.hours} ساعة.`
              : `Too many attempts. Locked for ${r.hours} hours.`,
            variant: 'destructive',
          });
          return;
        }
      }
      setLoading(false);
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
      return;
    }

    // success
    if (isLogin || isStaffMode) {
      await supabase.rpc('reset_login_attempts', { _phone: phone });
    }
    setLoading(false);
    if (!isLogin && !isStaffMode) {
      toast({ title: t('accountCreated'), description: lang === 'ar' ? 'تم تسجيل الدخول تلقائياً' : 'Signed in automatically' });
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card p-6 space-y-6"
      >
        <div className="text-center flex flex-col items-center gap-2">
          <img src={hmkLogo} alt="HMK Store" className="w-24 h-24 object-contain drop-shadow-[0_0_22px_rgba(255,176,0,0.5)]" />
          <h1 className="font-display font-extrabold text-2xl gradient-text tracking-widest">{t('storeName')}</h1>
          <p className="text-sm text-muted-foreground">
            {isStaffMode ? (lang === 'ar' ? 'تسجيل دخول الإدارة / المالك' : 'Admin / Owner Login') : (isLogin ? t('signIn') : t('signUp'))}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t('phone')}
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              className="w-full ps-10 pe-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="relative">
              <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={t('password')}
                value={password}
                maxLength={14}
                onChange={e => handlePasswordChange(e.target.value)}
                className="w-full ps-10 pe-10 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwError && <p className="text-xs text-destructive mt-1">{pwError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !phone || !password}
            className="w-full py-2.5 rounded-md font-display font-bold text-sm gradient-cyan-purple text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isStaffMode ? t('signIn') : (isLogin ? t('signIn') : t('signUp'))}
          </button>
        </form>

        {!isStaffMode && (
          <p className="text-center text-xs text-muted-foreground">
            {isLogin ? t('noAccount') : t('hasAccount')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
              {isLogin ? t('signUp') : t('signIn')}
            </button>
          </p>
        )}

        {isStaffMode && (
          <button
            onClick={() => { setIsStaffMode(false); setIsLogin(true); }}
            className="w-full text-center text-xs text-primary hover:underline"
          >
            {lang === 'ar' ? 'عودة لتسجيل دخول العملاء' : 'Back to Customer Login'}
          </button>
        )}
      </motion.div>

      {!isStaffMode && (
        <button
          onClick={() => { setIsStaffMode(true); setPhone(''); setPassword(''); }}
          className="mt-8 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors font-mono"
        >
          {t('staffPortal')}
        </button>
      )}
    </div>
  );
};

export default AuthPage;
