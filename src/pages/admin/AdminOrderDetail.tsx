import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Copy, Loader2, MessageCircle } from 'lucide-react';
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
  receipt_url: string | null;
  status: string;
  admin_note: string | null;
  user_id: string;
}

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'قيد الشحن' },
  { value: 'issue', label: 'هنالك خلل' },
  { value: 'completed', label: 'تم الشحن' },
  { value: 'rejected', label: 'مرفوض' },
];

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('in_progress');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (!data) return;
      setOrder(data as any);
      setStatus((data as any).status === 'pending' ? 'in_progress' : (data as any).status);
      setNote((data as any).admin_note || '');
      // signed url for receipt
      if (data.receipt_url) {
        if (data.receipt_url.startsWith('http')) setReceiptUrl(data.receipt_url);
        else {
          const { data: signed } = await supabase.storage.from('receipts').createSignedUrl(data.receipt_url, 300);
          if (signed) setReceiptUrl(signed.signedUrl);
        }
      }
      // customer phone
      const { data: prof } = await supabase.from('profiles').select('phone').eq('user_id', data.user_id).single();
      setPhone((prof as any)?.phone || null);
    })();
  }, [id]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `تم نسخ ${label}` });
  };

  const save = async () => {
    if (!order) return;
    if ((status === 'issue' || status === 'rejected') && !note.trim()) {
      toast({ title: 'يجب كتابة سبب', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const closing = status === 'completed' || status === 'rejected';
    const patch: any = { status, admin_note: note.trim() || null };
    if (closing) {
      patch.processing_by = null;
      patch.archived_at = new Date().toISOString();
      // add diamonds if completed
      if (status === 'completed') {
        const m = order.package_name.match(/(\d+)/);
        const diamonds = m ? parseInt(m[1]) : 0;
        if (diamonds > 0) await supabase.rpc('add_diamonds', { p_user_id: order.user_id, p_diamonds: diamonds });
      }
    }
    const { error } = await supabase.from('orders').update(patch).eq('id', order.id);
    setSaving(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم حفظ الحالة' });
    if (closing) navigate('/admin/orders');
  };

  const waLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '20')}?text=${encodeURIComponent(`طلبك (${order?.package_name}): ${note}`)}`
    : null;

  if (!order) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

  const showNote = status === 'issue' || status === 'rejected';

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/admin/orders')} className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowRight size={14} /> رجوع
      </button>

      <div className="glass-card p-4 space-y-1">
        <p className="font-display font-bold">{order.game_name}</p>
        <p className="text-xs text-muted-foreground">{order.package_name}</p>
        <p className="text-primary font-display font-extrabold">{order.price} ج.م</p>
      </div>

      {receiptUrl && (
        <div className="glass-card p-2">
          <p className="text-xs text-muted-foreground mb-2 px-2">إيصال الدفع</p>
          <img src={receiptUrl} alt="receipt" className="w-full rounded-lg max-h-[420px] object-contain bg-black/40" />
        </div>
      )}

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">الايدي</p>
            <p className="font-mono text-sm">{order.player_uid}</p>
          </div>
          <button onClick={() => copy(order.player_uid, 'الايدي')} className="p-2 rounded-lg glass-card text-primary">
            <Copy size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">السيرفر</p>
            <p className="font-mono text-sm">{order.server} {order.zone ? `(${order.zone})` : ''}</p>
          </div>
          <button onClick={() => copy(`${order.server} ${order.zone || ''}`.trim(), 'السيرفر')} className="p-2 rounded-lg glass-card text-primary">
            <Copy size={16} />
          </button>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <p className="text-sm font-display font-bold">حالة الطلب</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`py-2.5 rounded-lg text-xs font-display font-bold border transition-all ${
                status === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 text-muted-foreground border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {showNote && (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب سبب الخلل / الرفض..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-lg bg-green-600 text-white text-xs font-display font-bold flex items-center justify-center gap-2"
              >
                <MessageCircle size={14} /> إرسال للعميل عبر واتساب
              </a>
            )}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm disabled:opacity-50"
        >
          {saving ? 'جار الحفظ...' : 'حفظ الحالة'}
        </button>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
