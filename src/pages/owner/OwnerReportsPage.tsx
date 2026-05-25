import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, History, BarChart3, Award } from 'lucide-react';

type Tab = 'history' | 'products' | 'performance';

const OwnerReportsPage = () => {
  const [tab, setTab] = useState<Tab>('history');

  return (
    <div className="space-y-4">
      <div className="glass-card p-1 grid grid-cols-3 rounded-full">
        {([
          ['history', 'تاريخ', History],
          ['products', 'الطلبات', BarChart3],
          ['performance', 'الأداء', Award],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-2 rounded-full text-xs font-display font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === key ? 'bg-primary text-primary-foreground shadow-[0_0_14px_rgba(255,176,0,0.5)]' : 'text-muted-foreground'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'history' && <ShiftHistorySection />}
      {tab === 'products' && <ProductsStatsSection />}
      {tab === 'performance' && <PerformanceSection />}
    </div>
  );
};

const ShiftHistorySection = () => {
  const [admins, setAdmins] = useState<{ user_id: string; full_name: string }[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (supabase as any).rpc('owner_list_all_admins').then(({ data }: any) => {
      const list = data || [];
      setAdmins(list);
      if (list[0]) setSelected(list[0].user_id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    (supabase as any).rpc('owner_admin_shift_history', { _admin_id: selected }).then(({ data }: any) => {
      setShifts(data || []); setLoading(false);
    });
  }, [selected]);

  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {admins.map((a) => (
          <option key={a.user_id} value={a.user_id}>
            {a.full_name || a.user_id.slice(0, 8)}
          </option>
        ))}
      </select>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
      ) : shifts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">لا يوجد مناوبات لهذا الإدمن</p>
      ) : (
        <div className="space-y-2">
          {shifts.map((s) => (
            <div key={s.id} className="glass-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-display font-bold">
                  {new Date(s.opened_at).toLocaleString('ar-EG')}
                </p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  s.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {s.status === 'open' ? 'مفتوح' : 'مغلق'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-primary/10 rounded-md p-2">
                  <p className="text-muted-foreground">سمايل</p>
                  <p className="font-bold">{s.start_smile ?? '—'} → {s.end_smile ?? '—'}</p>
                </div>
                <div className="bg-primary/10 rounded-md p-2">
                  <p className="text-muted-foreground">محفظة</p>
                  <p className="font-bold">{s.start_wallet ?? '—'} → {s.end_wallet ?? '—'}</p>
                </div>
                <div className="bg-primary/10 rounded-md p-2">
                  <p className="text-muted-foreground">انستا باي</p>
                  <p className="font-bold">{s.start_instapay ?? '—'} → {s.end_instapay ?? '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductsStatsSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any).rpc('owner_product_stats').then(({ data }: any) => {
      setRows(data || []); setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>;
  if (!rows.length) return <p className="text-center text-muted-foreground py-8 text-sm">لا توجد بيانات</p>;

  const max = Math.max(...rows.map((r: any) => r.orders_count));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="glass-card p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="font-display font-bold truncate flex-1">
              {r.game_name} <span className="text-muted-foreground">· {r.package_name}</span>
            </div>
            <span className="font-display font-extrabold text-primary">{r.orders_count}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-fire"
              style={{ width: `${(r.orders_count / max) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            الإيراد: {Math.round(Number(r.revenue))} ج.م
          </p>
        </div>
      ))}
    </div>
  );
};

const PerformanceSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any).rpc('owner_admin_performance').then(({ data }: any) => {
      setRows(data || []); setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>;
  if (!rows.length) return <p className="text-center text-muted-foreground py-8 text-sm">لا توجد بيانات</p>;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.admin_id} className="glass-card p-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-display font-bold text-sm">{r.full_name || '—'}</p>
            <span className="font-display font-extrabold text-primary text-glow-gold">
              {Number(r.success_rate).toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-fire" style={{ width: `${Math.min(100, Number(r.success_rate))}%` }} />
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="text-green-400">مقبول: {r.accepted}</span>
            <span className="text-destructive">مرفوض: {r.rejected}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OwnerReportsPage;
