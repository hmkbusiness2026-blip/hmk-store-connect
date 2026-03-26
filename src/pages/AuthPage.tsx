import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    setLoading(true);
    const { error } = isLogin
      ? await signIn(phone, password)
      : await signUp(phone, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (!isLogin) {
      toast({ title: 'Account created!', description: 'You can now sign in.' });
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card p-6 space-y-6"
      >
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl gradient-text">HMK STORE</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              placeholder="Phone number (e.g. 01012345678)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !phone || !password}
            className="w-full py-2.5 rounded-md font-display font-bold text-sm gradient-cyan-purple text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
