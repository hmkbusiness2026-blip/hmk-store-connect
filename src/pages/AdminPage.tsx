import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Copy, Check, X, ExternalLink, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  game_name: string;
  package_name: string;
  price: number;
  player_uid: string;
  server: string;
  zone: string;
  payment_method: string;
  admin_name: string;
  receipt_url: string;
  status: string;
  created_at: string;
}

const AdminPage = () => {
  const { user, userRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [onDuty, setOnDuty] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userRole !== 'admin') return;
    fetchOrders();
  }, [userRole]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    toast({ title: `Order ${status}` });
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-6 text-center">
          <Shield size={40} className="mx-auto text-destructive mb-2" />
          <p className="text-foreground font-display font-bold">Access Denied</p>
          <p className="text-sm text-muted-foreground">Admin role required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-foreground">Admin Dashboard</h1>
        <button
          onClick={() => setOnDuty(!onDuty)}
          className={`px-3 py-1.5 rounded-full text-xs font-display font-bold flex items-center gap-1.5 transition-all ${
            onDuty ? 'bg-primary text-primary-foreground glow-cyan' : 'glass-card text-muted-foreground'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${onDuty ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
          {onDuty ? 'On Duty' : 'Off Duty'}
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-display font-bold text-sm text-foreground">{order.game_name}</p>
                  <p className="text-xs text-muted-foreground">{order.package_name} • {order.price} EGP</p>
                  <p className="text-xs text-muted-foreground">{order.server} • Zone: {order.zone}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-bold uppercase ${
                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                    : order.status === 'approved' ? 'bg-primary/20 text-primary'
                    : 'bg-destructive/20 text-destructive'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">UID:</span>
                <span className="text-xs text-foreground font-mono">{order.player_uid}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.player_uid);
                    toast({ title: 'UID Copied!' });
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Copy size={12} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {order.receipt_url && (
                  <a
                    href={order.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink size={12} /> View Receipt
                  </a>
                )}
                <span className="text-[10px] text-muted-foreground">{order.payment_method}</span>
              </div>

              {order.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(order.id, 'approved')}
                    className="flex-1 py-2 rounded-md bg-primary/20 text-primary text-xs font-display font-bold flex items-center justify-center gap-1"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, 'rejected')}
                    className="flex-1 py-2 rounded-md bg-destructive/20 text-destructive text-xs font-display font-bold flex items-center justify-center gap-1"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
