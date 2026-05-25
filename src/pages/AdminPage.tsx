import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Copy, Check, X, ExternalLink, Shield, Star, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  user_id: string;
}

const AdminPage = () => {
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [onDuty, setOnDuty] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPlatform, setReviewPlatform] = useState('Website');

  useEffect(() => {
    if (userRole !== 'admin' && (userRole as string) !== 'owner') return;
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
    
    // If approved, add diamonds to user's profile
    if (status === 'approved') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const diamondMatch = order.package_name.match(/(\d+)/);
        const diamonds = diamondMatch ? parseInt(diamondMatch[1]) : 0;
        if (diamonds > 0) {
          await supabase.rpc('add_diamonds', { p_user_id: order.user_id, p_diamonds: diamonds });
        }
      }
    }
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    toast({ title: `Order ${status}` });
  };

  const submitReview = async () => {
    if (!reviewName.trim() || !reviewText.trim() || !user) return;
    const { error } = await supabase.from('reviews').insert({
      customer_name: reviewName.trim(),
      review_text: reviewText.trim(),
      rating: reviewRating,
      platform: reviewPlatform,
      created_by: user.id,
    });
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      setShowReviewForm(false);
      setReviewName('');
      setReviewText('');
      setReviewRating(5);
      toast({ title: lang === 'ar' ? 'تم إضافة التقييم' : 'Review added' });
    }
  };

  if (userRole !== 'admin' && (userRole as string) !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-6 text-center">
          <Shield size={40} className="mx-auto text-destructive mb-2" />
          <p className="text-foreground font-display font-bold">{t('accessDenied')}</p>
          <p className="text-sm text-muted-foreground">{t('adminRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-foreground">{t('adminDashboard')}</h1>
        <button
          onClick={() => setOnDuty(!onDuty)}
          className={`px-3 py-1.5 rounded-full text-xs font-display font-bold flex items-center gap-1.5 transition-all ${
            onDuty ? 'bg-primary text-primary-foreground glow-cyan' : 'glass-card text-muted-foreground'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${onDuty ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
          {onDuty ? t('onDuty') : t('offDuty')}
        </button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="w-full bg-muted">
          <TabsTrigger value="orders" className="flex-1 text-xs font-display">{t('orders')}</TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1 text-xs font-display">{t('reviews')}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3 mt-3">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">{t('loading')}</p>
          ) : (
            orders.map((order, i) => (
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
                      toast({ title: t('uidCopied') });
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Copy size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {order.receipt_url && (
                    <button
                      type="button"
                      onClick={async () => {
                        // receipt_url may be a legacy public URL or a new storage path.
                        if (order.receipt_url.startsWith('http')) {
                          window.open(order.receipt_url, '_blank', 'noopener,noreferrer');
                          return;
                        }
                        const { data, error } = await supabase.storage
                          .from('receipts')
                          .createSignedUrl(order.receipt_url, 60);
                        if (error || !data) {
                          toast({ title: 'Error', description: 'Could not load receipt', variant: 'destructive' });
                          return;
                        }
                        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={12} /> {t('viewReceipt')}
                    </button>
                  )}
                  <span className="text-[10px] text-muted-foreground">{order.payment_method}</span>
                </div>

                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(order.id, 'approved')}
                      className="flex-1 py-2 rounded-md bg-primary/20 text-primary text-xs font-display font-bold flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> {t('approve')}
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'rejected')}
                      className="flex-1 py-2 rounded-md bg-destructive/20 text-destructive text-xs font-display font-bold flex items-center justify-center gap-1"
                    >
                      <X size={14} /> {t('reject')}
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-3 mt-3">
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary text-xs font-display font-bold"
          >
            <Plus size={14} /> {t('addCustomerReview')}
          </button>

          {showReviewForm && (
            <div className="glass-card p-4 space-y-3">
              <input
                placeholder={t('reviewName')}
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                placeholder={t('reviewText')}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('rating')}:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setReviewRating(r)}>
                      <Star size={16} className={r <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'} />
                    </button>
                  ))}
                </div>
              </div>
              <select
                value={reviewPlatform}
                onChange={(e) => setReviewPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Website">Website</option>
                <option value="Facebook">Facebook</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="TikTok">TikTok</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={submitReview}
                  disabled={!reviewName.trim() || !reviewText.trim()}
                  className="flex-1 py-2 rounded-md gradient-cyan-purple text-primary-foreground text-xs font-display font-bold disabled:opacity-40"
                >
                  {t('submit')}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 rounded-md glass-card text-muted-foreground text-xs font-display font-bold"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
