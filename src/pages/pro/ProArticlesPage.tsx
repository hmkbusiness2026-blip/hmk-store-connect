import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProStatus } from '@/hooks/useProStatus';

const ProArticlesPage = () => {
  const navigate = useNavigate();
  const { status, loading: statusLoading } = useProStatus();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('pro_articles' as any)
        .select('id,title,cover_url,created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  if (!statusLoading && !status.is_pro) {
    navigate('/pro', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto space-y-3" dir="rtl">
      <button onClick={() => navigate('/pro')} className="flex items-center gap-1 text-muted-foreground text-sm">
        <ChevronLeft size={18} /> رجوع
      </button>
      <h1 className="font-display font-bold text-lg text-foreground">جداول الأحداث</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">...</p>
      ) : items.length === 0 ? (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground">لا توجد جداول حالياً</div>
      ) : (
        items.map((a) => (
          <button
            key={a.id}
            onClick={() => navigate(`/pro/articles/${a.id}`)}
            className="w-full glass-card p-3 flex items-center gap-3 text-right hover:border-primary/30 transition-colors"
          >
            {a.cover_url ? (
              <img src={a.cover_url} alt={a.title} className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen size={20} className="text-primary" />
              </div>
            )}
            <span className="flex-1 font-display font-semibold text-sm text-foreground">{a.title}</span>
          </button>
        ))
      )}
    </div>
  );
};

export default ProArticlesPage;
