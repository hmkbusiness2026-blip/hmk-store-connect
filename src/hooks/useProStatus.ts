import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProStatus {
  total_spent: number;
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  duration_days: number;
  expires_at: string | null;
  days_remaining: number;
  is_pro: boolean;
}

const empty: ProStatus = {
  total_spent: 0, tier: 'none', duration_days: 0,
  expires_at: null, days_remaining: 0, is_pro: false,
};

export const useProStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ProStatus>(empty);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setStatus(empty); setLoading(false); return; }
    const { data } = await supabase.rpc('get_pro_status' as any);
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      setStatus({
        total_spent: Number(row.total_spent) || 0,
        tier: row.tier,
        duration_days: row.duration_days,
        expires_at: row.expires_at,
        days_remaining: row.days_remaining,
        is_pro: !!row.is_pro,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { status, loading, refresh };
};
