import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Wallet, ShoppingBag, Clock, Loader2 } from 'lucide-react';

interface Stats {
  active_admin_name: string | null;
  revenue_today: number;
  orders_today: number;
}

interface Shift {
  id: string;
  admin_id: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  full_name?: string;
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="relative glass-card p-4 border border-primary/20 overflow-hidden">
    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${color} blur-3xl opacity-40`} />
    <div className="relative space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon size={14} className="text-primary" />
        {label}
      </div>
      <p className="font-display font-extrabold text-xl text-foreground text-glow-gold">{value}</p>
    </div>
  </div>
);

const OwnerLeaderPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: s }, { data: list }] = await Promise.all([
      (supabase as any).rpc('owner_today_stats'),
      (supabase as any)
        .from('admin_shifts')
        .select('id, admin_id, status, opened_at, closed_at')
        .order('opened_at', { ascending: false })
        .limit(10),
    ]);
    const row = Array.isArray(s) ? s[0] : s;
    setStats(row || null);

    const ids = Array.from(new Set((list || []).map((x: any) => x.admin_id)));
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await (supabase as any)
        .from('admin_profiles').select('user_id, full_name').in('user_id', ids);
      (profs || []).forEach((p: any) => { names[p.user_id] = p.full_name || ''; });
    }
    setShifts((list || []).map((s: any) => ({ ...s, full_name: names[s.admin_id] || '—' })));
    setLoading(false);
  };

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3">
        <StatCard
          icon={UserCheck}
          label="الإدمن المناوب حالياً"
          value={stats?.active_admin_name ? stats.active_admin_name : 'لا يوجد'}
          color="bg-primary/30"
        />
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Wallet}
            label="المبالغ المحصلة اليوم"
            value={`${Math.round(stats?.revenue_today || 0)} ج.م`}
            color="bg-accent/30"
          />
          <StatCard
            icon={ShoppingBag}
            label="طلبات اليوم"
            value={stats?.orders_today ?? 0}
            color="bg-secondary/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          <h2 className="font-display font-extrabold text-sm">نظام المناوبة</h2>
        </div>
        <div className="space-y-2">
          {shifts.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">لا توجد مناوبات بعد</p>
          )}
          {shifts.map((s) => (
            <div key={s.id} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-sm">{s.full_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(s.opened_at).toLocaleString('ar-EG')}
                  {s.closed_at && ` ← ${new Date(s.closed_at).toLocaleString('ar-EG')}`}
                </p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  s.status === 'open'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s.status === 'open' ? 'مفتوح' : 'مغلق'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerLeaderPage;
