import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GameProfile {
  mlbb_id: string;
  mlbb_server: string;
  hok_uid: string;
}

const empty: GameProfile = { mlbb_id: '', mlbb_server: '', hok_uid: '' };

export const useGameProfile = () => {
  const { user } = useAuth();
  const [data, setData] = useState<GameProfile>(empty);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setData(empty); setLoading(false); return; }
    const { data: row } = await supabase
      .from('profiles')
      .select('mlbb_id, mlbb_server, hok_uid' as any)
      .eq('user_id', user.id)
      .maybeSingle();
    setData({
      mlbb_id: (row as any)?.mlbb_id ?? '',
      mlbb_server: (row as any)?.mlbb_server ?? '',
      hok_uid: (row as any)?.hok_uid ?? '',
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (patch: Partial<GameProfile>) => {
    if (!user) return { error: new Error('Not logged in') };
    const { error } = await supabase
      .from('profiles')
      .update(patch as any)
      .eq('user_id', user.id);
    if (!error) setData((d) => ({ ...d, ...patch }));
    return { error };
  }, [user]);

  return { data, loading, save, reload: load };
};
