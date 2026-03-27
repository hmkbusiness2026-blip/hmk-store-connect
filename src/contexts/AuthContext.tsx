import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type UserRole = 'client' | 'admin' | 'owner' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  phoneNumber: string | null;
  totalDiamonds: number;
  signUp: (phone: string, password: string) => Promise<{ error: any }>;
  signIn: (phone: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [totalDiamonds, setTotalDiamonds] = useState(0);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    setUserRole((data?.role as UserRole) || 'client');
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('total_diamonds')
      .eq('user_id', userId)
      .single();
    setTotalDiamonds(data?.total_diamonds || 0);
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setTimeout(() => {
              fetchRole(session.user.id);
              fetchProfile(session.user.id);
            }, 0);
          } else {
            setUserRole(null);
            setTotalDiamonds(0);
          }
          setLoading(false);
        }
      );
      subscription = data.subscription;
    } catch (e) {
      console.error('Auth listener error:', e);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => subscription?.unsubscribe();
  }, []);

  const phoneToEmail = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `${digits}@hmkstore.com`;
  };

  const signUp = async (phone: string, password: string) => {
    const fakeEmail = phoneToEmail(phone);
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
    });
    if (!error && data.user) {
      // Initialize profile and role via RPC
      await supabase.rpc('initialize_new_user', {
        p_user_id: data.user.id,
        p_phone: phone,
      });
    }
    return { error };
  };

  const signIn = async (phone: string, password: string) => {
    const fakeEmail = phoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const phoneNumber = user?.email?.replace('@hmkstore.com', '') || user?.phone || null;

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, phoneNumber, totalDiamonds, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
