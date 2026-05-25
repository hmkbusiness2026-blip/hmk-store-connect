import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type View = 'active' | 'archive';

const ACTIVE = ['pending', 'in_progress', 'issue'];
const ARCHIVE = ['completed', 'rejected'];

const OwnerOrdersPage = () => {
  const [view, setView] = useState<View>('active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('orders')
      .select('id, game_name, package_name, price, status, created_at, updated_at, admin_name, player_uid')
      .in('status', view === 'active' ? ACTIVE : ARCHIVE)
      .order(view === 'active' ? 'created_at' : 'updated_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [view]);

  const statusLabel = (s: string) => ({
    pending: 'قيد الانتظار', in_progress: 'قيد الشحن', issue: 'يوجد خلل',
    completed: 'تم الشحن', rejected: 'مرفوض',
  } as any)[s] || s;

  const statusClass = (s: string) => ({
    pending: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-primary/20 text-primary',
    issue: 'bg-destructive/20 text-destructive',
    completed: 'bg-green-500/20 text-green-400',
    rejected: 'bg-destructive/20 text-destructive',
  } as any)[s] || 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-4">
      {/* Segmented control — right = طلبات, left = أرشيف */}
      <div className="glass-card p-1 grid grid-cols-2 rounded-full">
        <button
          onClick={() => setView('archive')}
          className={`py-2 rounded-full text-xs font-display font-bold transition-all ${
            view === 'archive' ? 'bg-primary text-primary-foreground shadow-[0_0_14px_rgba(255,176,0,0.5)]' : 'text-muted-foreground'
          }`}
        >
          أرشيف
        </button>
        <button
          onClick={() => setView('active')}
          className={`py-2 rounded-full text-xs font-display font-bold transition-all ${
            view === 'active' ? 'bg-primary text-primary-foreground shadow-[0_0_14px_rgba(255,176,0,0.5)]' : 'text-muted-foreground'
          }`}
        >
          طلبات
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">
          {view === 'active' ? 'لا توجد طلبات نشطة' : 'لا يوجد أرشيف'}
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="glass-card p-4 space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-display font-bold text-sm">{o.game_name}</p>
                  <p className="text-xs text-muted-foreground">{o.package_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    UID: {o.player_uid} • {new Date(o.created_at).toLocaleString('ar-EG')}
                  </p>
                  {o.admin_name && (
                    <p className="text-[10px] text-primary mt-0.5">ادمن: {o.admin_name}</p>
                  )}
                </div>
                <div className="text-end space-y-1">
                  <p className="font-display font-extrabold text-base text-primary">{o.price} ج.م</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusClass(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerOrdersPage;
