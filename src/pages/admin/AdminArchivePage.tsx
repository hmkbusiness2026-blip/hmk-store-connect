import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const AdminArchivePage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['completed', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(100);
      setOrders(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <h2 className="font-display font-bold text-sm">الأرشيف</h2>
      {orders.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">لا يوجد طلبات مغلقة</p>}
      {orders.map((o) => (
        <div key={o.id} className="glass-card p-4 space-y-1">
          <div className="flex justify-between">
            <p className="font-display font-bold text-sm">{o.game_name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              o.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
            }`}>
              {o.status === 'completed' ? 'تم الشحن' : 'مرفوض'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{o.package_name} • {o.price} ج.م</p>
          <p className="text-[10px] text-muted-foreground">UID: {o.player_uid}</p>
          {o.admin_note && <p className="text-[11px] text-muted-foreground mt-1 border-t border-border pt-1">ملاحظة: {o.admin_note}</p>}
        </div>
      ))}
    </div>
  );
};

export default AdminArchivePage;
