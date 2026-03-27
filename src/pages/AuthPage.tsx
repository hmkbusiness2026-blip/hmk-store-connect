import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Loader2, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    setLoading(true);
    const { error } = isLogin || isStaffMode
      ? await signIn(phone, password)
      : await signUp(phone, password);
    setLoading(false);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else if (!isLogin && !isStaffMode) {
      toast({ title: t('accountCreated'), description: t('canSignIn') });
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card p-6 space-y-6"
      >
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl gradient-text">{t('storeName')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isStaffMode ? (lang === 'ar' ? 'تسجيل دخول الإدارة / المالك' : 'Admin / Owner Login') : (isLogin ? t('signIn') : t('signUp'))}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              placeholder={t('phone')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full ps-10 pe-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder={t('password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full ps-10 pe-10 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
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
            {t('lang') === 'ar' ? 'عودة لتسجيل دخول العملاء' : 'Back to Customer Login'}
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
