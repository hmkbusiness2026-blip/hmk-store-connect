import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Filter, RefreshCw } from 'lucide-react';

interface LogRow {
  id: string;
  created_at: string;
  event_type: string;
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  details: Record<string, unknown>;
}

const TYPE_OPTIONS = [
  { value: 'all',      label: 'كل الأحداث' },
  { value: 'auth',     label: 'تسجيل الدخول' },
  { value: 'order',    label: 'الطلبات' },
  { value: 'shift',    label: 'الشفتات' },
  { value: 'handover', label: 'تسليم الشفت' },
  { value: 'security', label: 'الأمان' },
  { value: 'system',   label: 'النظام' },
];

const DATE_OPTIONS = [
  { value: 'today', label: 'اليوم' },
  { value: '7d',    label: 'آخر ٧ أيام' },
  { value: '30d',   label: 'آخر ٣٠ يوم' },
  { value: 'all',   label: 'الكل' },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });

const labelFor = (action: string) => {
  const map: Record<string, string> = {
    login_success: 'دخول ناجح',
    login_failed: 'محاولة فاشلة',
    order_created: 'طلب جديد',
    order_status_changed: 'تغيير حالة طلب',
    shift_opened: 'فتح شفت',
    shift_closed: 'إغلاق شفت',
    handover_requested: 'طلب تسليم شفت',
    handover_accepted: 'قبول تسليم',
    handover_rejected: 'رفض تسليم',
  };
  return map[action] || action;
};

const OwnerLogsPage = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [type, setType] = useState('all');
  const [date, setDate] = useState('7d');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (type !== 'all') q = q.eq('event_type', type);
    if (date !== 'all') {
      const since = new Date();
      if (date === 'today') since.setHours(0, 0, 0, 0);
      if (date === '7d')   since.setDate(since.getDate() - 7);
      if (date === '30d')  since.setDate(since.getDate() - 30);
      q = q.gte('created_at', since.toISOString());
    }
    const { data } = await q;
    setRows((data as LogRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [type, date]);

  useEffect(() => {
    const ch = supabase
      .channel('system_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, []);

  const summary = useMemo(() => ({
    total: rows.length,
    auth: rows.filter(r => r.event_type === 'auth').length,
    order: rows.filter(r => r.event_type === 'order').length,
    security: rows.filter(r => r.event_type === 'security').length,
  }), [rows]);

  return (
    <div className="space-y-4" dir="rtl">
      <header className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-lg gradient-text">سجل النظام</h2>
        <button onClick={load} className="p-2 rounded-full glass-card text-muted-foreground hover:text-foreground">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="grid grid-cols-4 gap-2">
        {[
          { l: 'الإجمالي', v: summary.total },
          { l: 'دخول',    v: summary.auth },
          { l: 'طلبات',   v: summary.order },
          { l: 'أمان',    v: summary.security },
        ].map((s) => (
          <div key={s.l} className="glass-card p-2 text-center">
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
            <p className="font-display font-extrabold text-base text-primary">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-3 flex items-center gap-2">
        <Filter size={14} className="text-muted-foreground" />
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="bg-transparent text-xs text-foreground border border-border rounded px-2 py-1.5 flex-1">
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-background">{o.label}</option>)}
        </select>
        <select value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-transparent text-xs text-foreground border border-border rounded px-2 py-1.5 flex-1">
          {DATE_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-background">{o.label}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="col-span-3">التاريخ والوقت</div>
          <div className="col-span-2">المستخدم</div>
          <div className="col-span-3">الحدث</div>
          <div className="col-span-4">التفاصيل</div>
        </div>
        {rows.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">لا توجد سجلات</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] border-b border-border/40 last:border-b-0">
              <div className="col-span-3 text-muted-foreground">{fmt(r.created_at)}</div>
              <div className="col-span-2 font-bold text-foreground">
                {r.actor_role || 'system'}
              </div>
              <div className="col-span-3 text-primary">{labelFor(r.action)}</div>
              <div className="col-span-4 text-muted-foreground break-all">
                {Object.entries(r.details || {}).slice(0, 4)
                  .map(([k, v]) => `${k}: ${String(v)}`).join(' · ') || '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OwnerLogsPage;
