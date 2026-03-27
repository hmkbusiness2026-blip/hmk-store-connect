import { useState, useEffect } from 'react';
import { Star, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  customer_name: string;
  platform: string;
  rating: number;
  review_text: string;
}

const platformColors: Record<string, string> = {
  Website: 'bg-primary/20 text-primary',
  Facebook: 'bg-[#1877F2]/20 text-[#1877F2]',
  WhatsApp: 'bg-[#25D366]/20 text-[#25D366]',
  TikTok: 'bg-[#FF0050]/20 text-[#FF0050]',
};

const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [platform, setPlatform] = useState('Website');
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setReviews((data as Review[]) || []);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim() || !user) return;
    const { error } = await supabase.from('reviews').insert({
      customer_name: name.trim(),
      review_text: text.trim(),
      rating,
      platform,
      created_by: user.id,
    });
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      setShowForm(false);
      setName('');
      setText('');
      setRating(5);
      fetchReviews();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          {t('customerReviews')}
        </h2>
        {user && (
          <button
            onClick={() => setShowForm(true)}
            className="text-primary text-xs font-display font-bold flex items-center gap-1"
          >
            <Plus size={14} /> {t('addReview')}
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="glass-card p-3 min-w-[200px] max-w-[220px] flex-shrink-0 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-xs text-foreground truncate">{review.customer_name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-display font-bold ${platformColors[review.platform] || 'bg-muted text-muted-foreground'}`}>
                {review.platform}
              </span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">{review.review_text}</p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-xs text-muted-foreground py-4">{t('loading')}</p>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-5 w-full max-w-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-foreground">{t('addReview')}</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <input
                placeholder={t('reviewName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                placeholder={t('reviewText')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('rating')}:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setRating(r)}>
                      <Star
                        size={18}
                        className={r <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Website">Website</option>
                <option value="Facebook">Facebook</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="TikTok">TikTok</option>
              </select>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !text.trim()}
                className="w-full py-2.5 rounded-md font-display font-bold text-sm gradient-cyan-purple text-primary-foreground disabled:opacity-40"
              >
                {t('submit')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewsCarousel;
