import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveAdmin {
  admin_id: string;
  full_name: string | null;
  vodafone_cash: string | null;
  instapay_id: string | null;
}

export const useStoreOnDuty = () => {
  const [onDuty, setOnDuty] = useState<boolean | null>(null);
  const [activeAdmin, setActiveAdmin] = useState<ActiveAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [{ data: onDutyData }, { data: adminData }] = await Promise.all([
      supabase.rpc('is_store_on_duty'),
      supabase.rpc('get_active_admin'),
    ]);
    setOnDuty(!!onDutyData);
    const row = Array.isArray(adminData) ? adminData[0] : adminData;
    setActiveAdmin(row ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('admin_shifts_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_shifts' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { onDuty, activeAdmin, loading, refresh };
};
