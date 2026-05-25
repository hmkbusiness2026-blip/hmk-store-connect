import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Play, Loader2 } from 'lucide-react';

interface Order {
  id: string;
  game_name: string;
  package_name: string;
  price: number;
  created_at: string;
  status: string;
  processing_by: string | null;
}

const ACTIVE_STATUSES = ['pending', 'in_progress', 'issue'];

const AdminOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, game_name, package_name, price, created_at, status, processing_by')
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false });
    setOrders((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const myActiveOrder = orders.find(
    (o) => o.processing_by === user?.id && (o.status === 'in_progress' || o.status === 'issue')
  );
  const isLocked = !!myActiveOrder;

  const startProcessing = async (orderId: string) => {
    if (!user || isLocked) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'in_progress', processing_by: user.id })
      .eq('id', orderId)
      .eq('status', 'pending');
    if (!error) navigate(`/admin/orders/${orderId}`);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-3">
      {isLocked && (
        <div className="glass-card p-3 border border-primary/40 text-xs text-primary flex items-center gap-2">
          <Lock size={14} /> لديك طلب نشط — اكمله قبل بدء طلب جديد
        </div>
      )}
      {orders.length === 0 && (
        <p className="text-center text-muted-foreground py-10 text-sm">لا توجد طلبات نشطة</p>
      )}
      {orders.map((o, i) => {
        const isMine = o.processing_by === user?.id && o.status !== 'pending';
        const disabled = isLocked && !isMine;
        return (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-display font-bold text-sm">{o.game_name}</p>
                <p className="text-xs text-muted-foreground">{o.package_name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(o.created_at).toLocaleString('ar-EG')}
                </p>
              </div>
              <div className="text-end">
                <p className="font-display font-extrabold text-base text-primary">{o.price} ج.م</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                  : o.status === 'issue' ? 'bg-destructive/20 text-destructive'
                  : 'bg-primary/20 text-primary'
                }`}>
                  {o.status === 'pending' ? 'قيد الانتظار' : o.status === 'in_progress' ? 'قيد الشحن' : 'يوجد خلل'}
                </span>
              </div>
            </div>
            <button
              onClick={() => isMine ? navigate(`/admin/orders/${o.id}`) : startProcessing(o.id)}
              disabled={disabled}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {disabled ? <><Lock size={14} /> مقفل</> : isMine ? <>متابعة الطلب</> : <><Play size={14} /> البدء بالشحن</>}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AdminOrdersPage;
