import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Search, UserPlus, UserMinus, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  user_id: string;
  phone: string | null;
  role?: string;
}

const OwnerPage = () => {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchPhone, setSearchPhone] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, phone');
    
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const merged = (profilesData || []).map((p: any) => ({
      ...p,
      role: (rolesData || []).find((r: any) => r.user_id === p.user_id)?.role || 'client',
    }));

    setProfiles(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (userRole === 'owner') fetchProfiles();
  }, [userRole]);

  const assignRole = async (userId: string, role: 'admin' | 'client') => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

    if (error) {
      // Try insert if no existing row
      if (role === 'admin') {
        await supabase.from('user_roles').insert({ user_id: userId, role });
      }
    }
    toast({ title: role === 'admin' ? t('assignAdmin') : t('removeAdmin') });
    fetchProfiles();
  };

  if (userRole !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-6 text-center">
          <Shield size={40} className="mx-auto text-destructive mb-2" />
          <p className="text-foreground font-display font-bold">{t('accessDenied')}</p>
          <p className="text-sm text-muted-foreground">{t('ownerRequired')}</p>
        </div>
      </div>
    );
  }

  const filtered = profiles.filter((p) =>
    searchPhone ? (p.phone || '').includes(searchPhone) : true
  );

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Crown size={20} className="text-accent" />
        <h1 className="font-display font-bold text-lg text-foreground">{t('ownerDashboard')}</h1>
      </div>

      <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
        {t('userManagement')}
      </h2>

      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder={t('enterPhone')}
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="w-full ps-10 pe-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">{t('loading')}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((profile) => (
            <div key={profile.user_id} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-foreground">{profile.phone || 'N/A'}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
              </div>
              {profile.role === 'admin' ? (
                <button
                  onClick={() => assignRole(profile.user_id, 'client')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-destructive/20 text-destructive text-xs font-display font-bold"
                >
                  <UserMinus size={14} /> {t('removeAdmin')}
                </button>
              ) : profile.role !== 'owner' ? (
                <button
                  onClick={() => assignRole(profile.user_id, 'admin')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-display font-bold"
                >
                  <UserPlus size={14} /> {t('assignAdmin')}
                </button>
              ) : (
                <span className="text-xs text-accent font-display font-bold">Owner</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerPage;
