import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Inbox, AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

const Card = ({ icon: Icon, label, value, href, accent }: any) => (
  <Link to={href ?? '#'} className="glass-card p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent ?? 'bg-primary/15 text-primary'}`}>
      <Icon size={18} />
    </div>
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-lg">{value}</div>
    </div>
  </Link>
);

const StaffDashboard = () => {
  const { isAdmin } = usePermissions();
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    (async () => {
      const [pending, unread, lowStock, revenue, customers, openMsgs] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('archived_at', null),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('inventory').select('id, stock, low_threshold'),
        supabase.from('orders').select('price').eq('status', 'approved').is('archived_at', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      const low = (lowStock.data ?? []).filter((r: any) => r.stock <= r.low_threshold).length;
      const rev = (revenue.data ?? []).reduce((s: number, r: any) => s + Number(r.price), 0);
      setStats({
        pending: pending.count ?? 0,
        unread: unread.count ?? 0,
        low,
        revenue: rev,
        customers: customers.count ?? 0,
        openMsgs: openMsgs.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-display font-bold text-xl">Action Queue</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card icon={ShoppingCart} label="Pending Orders" value={stats.pending ?? '–'} href="/staff/orders" accent="bg-yellow-500/15 text-yellow-400" />
        <Card icon={Inbox} label="New Messages" value={stats.unread ?? '–'} href="/staff/inbox" accent="bg-red-500/15 text-red-400" />
        <Card icon={AlertTriangle} label="Low Stock" value={stats.low ?? '–'} href="/staff/inventory" accent="bg-orange-500/15 text-orange-400" />
      </div>

      {isAdmin && (
        <>
          <h2 className="font-display font-bold text-sm text-muted-foreground uppercase mt-6">KPIs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card icon={DollarSign} label="Approved Revenue (EGP)" value={stats.revenue?.toLocaleString() ?? '–'} accent="bg-green-500/15 text-green-400" />
            <Card icon={Users} label="Customers" value={stats.customers ?? '–'} href="/staff/staff" />
            <Card icon={TrendingUp} label="Open Conversations" value={stats.openMsgs ?? '–'} href="/staff/inbox" accent="bg-purple-500/15 text-purple-400" />
          </div>
        </>
      )}

      <div className="text-[10px] text-muted-foreground/60 mt-8">
        Hotkeys: <kbd className="px-1 bg-muted rounded">g</kbd>+<kbd className="px-1 bg-muted rounded">o</kbd> orders ·
        <kbd className="px-1 bg-muted rounded ms-1">g</kbd>+<kbd className="px-1 bg-muted rounded">i</kbd> inbox ·
        <kbd className="px-1 bg-muted rounded ms-1">/</kbd> search
      </div>
    </div>
  );
};

export default StaffDashboard;
