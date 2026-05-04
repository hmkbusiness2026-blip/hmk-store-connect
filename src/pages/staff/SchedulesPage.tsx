import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from 'lucide-react';

const SchedulesPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ user_id: '', shift_start: '', shift_end: '', notes: '' });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('staff_schedules').select('*').order('shift_start', { ascending: false }).limit(100);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.user_id || !form.shift_start || !form.shift_end) return;
    const { error } = await supabase.from('staff_schedules').insert({
      user_id: form.user_id,
      shift_start: new Date(form.shift_start).toISOString(),
      shift_end: new Date(form.shift_end).toISOString(),
      notes: form.notes || null,
    });
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    setForm({ user_id: '', shift_start: '', shift_end: '', notes: '' });
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-primary" />
        <h1 className="font-display font-bold text-xl">Schedules</h1>
      </div>
      <div className="glass-card p-4 space-y-2">
        <h2 className="text-sm font-bold">Add Shift</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input placeholder="User UUID" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}
            className="px-3 py-2 rounded-md bg-muted border border-border text-sm font-mono" />
          <input type="datetime-local" value={form.shift_start} onChange={e => setForm({ ...form, shift_start: e.target.value })}
            className="px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          <input type="datetime-local" value={form.shift_end} onChange={e => setForm({ ...form, shift_end: e.target.value })}
            className="px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          <button onClick={add} className="px-4 py-2 rounded-md gradient-cyan-purple text-primary-foreground text-sm font-bold">Add</button>
        </div>
        <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          className="w-full px-3 py-2 rounded-md bg-muted border border-border text-sm" />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 uppercase"><tr>
            <th className="text-start p-2">User</th><th className="text-start p-2">Start</th><th className="text-start p-2">End</th><th className="text-start p-2">Notes</th>
          </tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-2 font-mono">{i.user_id.slice(0, 8)}</td>
                <td className="p-2">{new Date(i.shift_start).toLocaleString()}</td>
                <td className="p-2">{new Date(i.shift_end).toLocaleString()}</td>
                <td className="p-2">{i.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SchedulesPage;
