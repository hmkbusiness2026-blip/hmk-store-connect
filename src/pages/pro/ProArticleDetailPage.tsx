import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useProStatus } from '@/hooks/useProStatus';
import ProWatermark from '@/components/ProWatermark';

const ProArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { phoneNumber } = useAuth();
  const { status, loading: statusLoading } = useProStatus();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('pro_articles' as any)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setArticle(data);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', stop);
    document.addEventListener('dragstart', stop);
    document.addEventListener('copy', stop);
    return () => {
      document.removeEventListener('contextmenu', stop);
      document.removeEventListener('dragstart', stop);
      document.removeEventListener('copy', stop);
    };
  }, []);

  if (!statusLoading && !status.is_pro) {
    navigate('/pro', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto relative select-none" dir="rtl"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <ProWatermark text={phoneNumber || 'HMK STORE'} />
      <button onClick={() => navigate('/pro/articles')} className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
        <ChevronLeft size={18} /> رجوع
      </button>
      {loading ? (
        <p className="text-sm text-muted-foreground">...</p>
      ) : !article ? (
        <p className="text-sm text-muted-foreground">المقال غير موجود</p>
      ) : (
        <article className="glass-card p-4 space-y-3 relative z-10">
          <h1 className="font-display font-bold text-lg text-foreground">{article.title}</h1>
          {article.cover_url && (
            <img src={article.cover_url} alt={article.title} className="w-full rounded-lg pointer-events-none" />
          )}
          <div
            className="prose prose-invert max-w-none text-sm text-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_th]:border-border [&_td]:border-border [&_img]:rounded-lg [&_img]:pointer-events-none"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        </article>
      )}
    </div>
  );
};

export default ProArticleDetailPage;
