import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Smile } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProStatus } from '@/hooks/useProStatus';
import { toast } from '@/hooks/use-toast';

const ProEmotesPage = () => {
  const navigate = useNavigate();
  const { status, loading: statusLoading } = useProStatus();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('pro_emote_codes' as any)
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  if (!statusLoading && !status.is_pro) {
    navigate('/pro', { replace: true });
    return null;
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: 'تم النسخ', description: code });
    } catch {
      toast({ title: 'تعذر النسخ', variant: 'destructive' as any });
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto space-y-3" dir="rtl">
      <button onClick={() => navigate('/pro')} className="flex items-center gap-1 text-muted-foreground text-sm">
        <ChevronLeft size={18} /> رجوع
      </button>
      <h1 className="font-display font-bold text-lg text-foreground">أكواد الإيموتات</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">...</p>
      ) : items.length === 0 ? (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground">لا توجد أكواد حالياً</div>
      ) : (
        items.map((e) => (
          <div key={e.id} className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-3">
              {e.image_url ? (
                <img src={e.image_url} alt={e.title} className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smile size={24} className="text-primary" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-display font-bold text-sm text-foreground">{e.title}</p>
                <p className="font-mono text-xs text-muted-foreground break-all">{e.code}</p>
              </div>
              <button
                onClick={() => copy(e.code)}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display font-bold flex items-center gap-1"
              >
                <Copy size={14} /> نسخ
              </button>
            </div>
            {e.admin_notes && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">ملاحظات الإدارة: </span>{e.admin_notes}
              </div>
            )}
            {e.expires_at && (
              <div className="text-xs text-accent">
                تاريخ الصلاحية: {new Date(e.expires_at).toLocaleDateString('ar-EG')}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ProEmotesPage;
