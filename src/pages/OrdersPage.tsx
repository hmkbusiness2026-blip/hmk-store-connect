import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Order {
  id: string;
  game_name: string;
  package_name: string;
  price: number;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400' },
  approved: { icon: CheckCircle, color: 'text-primary' },
  rejected: { icon: XCircle, color: 'text-destructive' },
};

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <h1 className="font-display font-bold text-lg text-foreground mb-4">My Orders</h1>
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Package size={40} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-display font-semibold text-sm text-foreground">{order.game_name}</p>
                  <p className="text-xs text-muted-foreground">{order.package_name}</p>
                  <p className="text-xs text-primary font-bold">{order.price} EGP</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Icon size={18} className={cfg.color} />
                  <span className={`text-[10px] uppercase font-display font-bold ${cfg.color}`}>{order.status}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
