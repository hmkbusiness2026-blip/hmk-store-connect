import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminProEmotesPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('pro_emote_codes' as any)
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title || !editing.code) {
      return toast({ title: 'العنوان والكود مطلوبان', variant: 'destructive' as any });
    }
    const payload: any = {
      title: editing.title,
      code: editing.code,
      image_url: editing.image_url || null,
      admin_notes: editing.admin_notes || null,
      expires_at: editing.expires_at || null,
      active: editing.active !== false,
    };
    let err;
    if (editing.id) {
      ({ error: err } = await supabase.from('pro_emote_codes' as any).update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('pro_emote_codes' as any).insert(payload));
    }
    if (err) return toast({ title: 'خطأ', description: err.message, variant: 'destructive' as any });
    toast({ title: 'تم الحفظ' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف؟')) return;
    await supabase.from('pro_emote_codes' as any).delete().eq('id', id);
    load();
  };

  if (editing) {
    return (
      <div className="space-y-3" dir="rtl">
        <h2 className="font-display font-bold text-lg">{editing.id ? 'تعديل إيموت' : 'إيموت جديد'}</h2>
        <input className="w-full glass-card p-3 text-sm bg-transparent" placeholder="العنوان"
          value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
        <input className="w-full glass-card p-3 text-sm bg-transparent font-mono" placeholder="الكود"
          value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
        <input className="w-full glass-card p-3 text-sm bg-transparent" placeholder="رابط صورة الإيموت"
          value={editing.image_url || ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
        <textarea className="w-full glass-card p-3 text-sm bg-transparent" placeholder="ملاحظات الإدارة"
          value={editing.admin_notes || ''} onChange={(e) => setEditing({ ...editing, admin_notes: e.target.value })} />
        <label className="block text-xs text-muted-foreground">تاريخ الصلاحية</label>
        <input type="datetime-local" className="w-full glass-card p-3 text-sm bg-transparent"
          value={editing.expires_at ? new Date(editing.expires_at).toISOString().slice(0,16) : ''}
          onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={editing.active !== false}
            onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
          مفعل
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
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
        <h2 className="font-display font-bold text-lg">أكواد الإيموتات (PRO)</h2>
        <button onClick={() => setEditing({})} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
          <Plus size={14} /> جديد
        </button>
      </div>
      {items.map((e) => (
        <div key={e.id} className="glass-card p-3 flex items-center gap-2">
          {e.image_url && <img src={e.image_url} className="w-10 h-10 rounded object-cover" alt="" />}
          <div className="flex-1">
            <p className="font-bold text-sm">{e.title}</p>
            <p className="text-xs font-mono text-muted-foreground">{e.code}</p>
          </div>
          <button onClick={() => setEditing(e)} className="text-xs px-2 py-1 rounded bg-primary/15 text-primary">تعديل</button>
          <button onClick={() => remove(e.id)} className="text-destructive p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
};
export default AdminProEmotesPage;
