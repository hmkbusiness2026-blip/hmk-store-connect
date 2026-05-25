import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminProArticlesPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('pro_articles' as any)
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title) return toast({ title: 'العنوان مطلوب', variant: 'destructive' as any });
    const payload: any = {
      title: editing.title,
      content: editing.content || '',
      cover_url: editing.cover_url || null,
      published: editing.published !== false,
    };
    let err;
    if (editing.id) {
      ({ error: err } = await supabase.from('pro_articles' as any).update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('pro_articles' as any).insert(payload));
    }
    if (err) return toast({ title: 'خطأ', description: err.message, variant: 'destructive' as any });
    toast({ title: 'تم الحفظ' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف؟')) return;
    await supabase.from('pro_articles' as any).delete().eq('id', id);
    load();
  };

  if (editing) {
    return (
      <div className="space-y-3" dir="rtl">
        <h2 className="font-display font-bold text-lg">{editing.id ? 'تعديل مقال' : 'مقال جديد'}</h2>
        <input
          className="w-full glass-card p-3 text-sm bg-transparent"
          placeholder="العنوان"
          value={editing.title || ''}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
        />
        <input
          className="w-full glass-card p-3 text-sm bg-transparent"
          placeholder="رابط صورة الغلاف (اختياري)"
          value={editing.cover_url || ''}
          onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })}
        />
        <textarea
          className="w-full glass-card p-3 text-sm bg-transparent min-h-[300px] font-mono"
          placeholder="المحتوى بصيغة HTML (يدعم <p>, <h2>, <table>, <img src='...'/> ...)"
          value={editing.content || ''}
          onChange={(e) => setEditing({ ...editing, content: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editing.published !== false}
            onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
          />
          منشور
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center gap-2">
            <Save size={16} /> حفظ
          </button>
          <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-border text-sm">إلغاء</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">جداول الأحداث (PRO)</h2>
        <button onClick={() => setEditing({})} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
          <Plus size={14} /> جديد
        </button>
      </div>
      {items.map((a) => (
        <div key={a.id} className="glass-card p-3 flex items-center gap-2">
          <div className="flex-1">
            <p className="font-bold text-sm">{a.title}</p>
            <p className="text-xs text-muted-foreground">{a.published ? 'منشور' : 'مخفي'}</p>
          </div>
          <button onClick={() => setEditing(a)} className="text-xs px-2 py-1 rounded bg-primary/15 text-primary">تعديل</button>
          <button onClick={() => remove(a.id)} className="text-destructive p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
};
export default AdminProArticlesPage;
