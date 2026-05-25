import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Shift {
  id: string;
  admin_id: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  start_smile: number | null;
  start_wallet: number | null;
  start_instapay: number | null;
  end_smile: number | null;
  end_wallet: number | null;
  end_instapay: number | null;
}

export interface HandoverRow {
  id: string;
  shift_id: string;
  from_admin: string;
  to_admin: string;
  status: string;
  created_at: string;
}

const sb = supabase as any;

export const useCurrentShift = () => {
  const { user } = useAuth();
  const [myOpenShift, setMyOpenShift] = useState<Shift | null>(null);
  const [anyOpenShift, setAnyOpenShift] = useState<Shift | null>(null);
  const [pendingIncoming, setPendingIncoming] = useState<HandoverRow[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<HandoverRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: shifts } = await sb.from('admin_shifts').select('*').eq('status', 'open').limit(1);
    const open = (shifts?.[0] ?? null) as Shift | null;
    setAnyOpenShift(open);
    setMyOpenShift(open && user && open.admin_id === user.id ? open : null);

    if (user) {
      const { data: incoming } = await sb.from('shift_handovers').select('*').eq('to_admin', user.id).eq('status', 'pending');
      setPendingIncoming((incoming as HandoverRow[]) ?? []);
      const { data: outgoing } = await sb.from('shift_handovers').select('*').eq('from_admin', user.id).eq('status', 'pending');
      setPendingOutgoing((outgoing as HandoverRow[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel('shift_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_shifts' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_handovers' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  return { myOpenShift, anyOpenShift, pendingIncoming, pendingOutgoing, loading, refresh };
};
