import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShiftRow {
  id: string;
  opened_at: string;
  closed_at: string | null;
  status: string;
  closed_reason: string | null;
  start_smile: number | null; end_smile: number | null;
  start_wallet: number | null; end_wallet: number | null;
  start_instapay: number | null; end_instapay: number | null;
  start_smile_note: string | null; end_smile_note: string | null;
  start_wallet_note: string | null; end_wallet_note: string | null;
  start_instapay_note: string | null; end_instapay_note: string | null;
}

const AdminWorkHistoryPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('admin_shifts')
      .select('*')
      .eq('admin_id', user.id)
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .then(({ data }: any) => { setRows(data ?? []); setLoading(false); });
  }, [user]);

  return (
    <div className="space-y-3">
      <h2 className="font-display font-extrabold text-base">تاريخ العمل / Work History</h2>
      {loading && <p className="text-xs text-muted-foreground">جار التحميل...</p>}
      {!loading && rows.length === 0 && <p className="text-xs text-muted-foreground">لا يوجد شفتات سابقة.</p>}
      {rows.map(r => (
        <div key={r.id} className="glass-card p-4 space-y-2">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{new Date(r.opened_at).toLocaleString('ar-EG')}</span>
            <span>{r.closed_reason === 'handover' ? 'تسليم' : 'انهاء'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              ['سمايل', r.start_smile, r.end_smile, r.start_smile_note, r.end_smile_note],
              ['محفظة', r.start_wallet, r.end_wallet, r.start_wallet_note, r.end_wallet_note],
              ['انستا', r.start_instapay, r.end_instapay, r.start_instapay_note, r.end_instapay_note],
            ].map(([label, s, e, sn, en]: any) => (
              <div key={label} className="bg-muted/40 rounded p-2">
                <p className="font-display font-bold text-[11px]">{label}</p>
                <p>بدء: <span className="font-mono">{s ?? '—'}</span></p>
                <p>اند: <span className="font-mono">{e ?? '—'}</span></p>
                {(sn || en) && <p className="text-[10px] text-muted-foreground mt-1">{sn || ''} {en ? `/ ${en}` : ''}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminWorkHistoryPage;
