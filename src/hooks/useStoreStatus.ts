import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreStatus {
  is_open: boolean;
  admin_name: string | null;
  updated_at: string;
}

export const useStoreStatus = () => {
  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    const { data } = await supabase
      .from('store_status')
      .select('is_open, admin_name, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setStatus(data as StoreStatus | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const channel = supabase
      .channel('store_status_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_status' }, () => fetchStatus())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { status, loading, refetch: fetchStatus };
};
