import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus } from 'lucide-react';

interface Inv { id: string; game_id: string; package_name: string; stock: number; low_threshold: number; }

const InventoryPage = () => {
  const [items, setItems] = useState<Inv[]>([]);
  const [edit, setEdit] = useState<Record<string, { stock: number; low_threshold: number }>>({});
  const [adding, setAdding] = useState({ game_id: '', package_name: '', stock: 0, low_threshold: 5 });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('inventory').select('*').order('game_id');
    setItems((data ?? []) as Inv[]);
  };

  useEffect(() => { load(); }, []);

  const save = async (game_id: string, package_name: string, stock: number, low_threshold: number) => {
    const { data, error } = await supabase.functions.invoke('staff-action', {
      body: { action: 'inventory_set', payload: { game_id, package_name, stock, low_threshold } },
    });
    if (error || (data as any)?.error) {
      toast({ title: (data as any)?.error ?? error?.message ?? 'Save failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved' });
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Package size={18} className="text-primary" />
        <h1 className="font-display font-bold text-xl">Inventory</h1>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2"><Plus size={14} /> Add / Update</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input placeholder="Game ID" value={adding.game_id} onChange={e => setAdding({ ...adding, game_id: e.target.value })}
            className="px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          <input placeholder="Package" value={adding.package_name} onChange={e => setAdding({ ...adding, package_name: e.target.value })}
            className="px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          <input type="number" placeholder="Stock" value={adding.stock} onChange={e => setAdding({ ...adding, stock: +e.target.value })}
            className="px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          <input type="number" placeholder="Low threshold" value={adding.low_threshold} onChange={e => setAdding({ ...adding, low_threshold: +e.target.value })}
            className="px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          <button onClick={() => save(adding.game_id, adding.package_name, adding.stock, adding.low_threshold)}
            disabled={!adding.game_id || !adding.package_name}
            className="px-4 py-2 rounded-md gradient-cyan-purple text-primary-foreground text-sm font-bold disabled:opacity-40">Save</button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr>
              <th className="text-start p-3">Game</th>
              <th className="text-start p-3">Package</th>
              <th className="text-start p-3">Stock</th>
              <th className="text-start p-3">Low at</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const e = edit[it.id] ?? { stock: it.stock, low_threshold: it.low_threshold };
              const low = it.stock <= it.low_threshold;
              return (
                <tr key={it.id} className={`border-t border-border ${low ? 'bg-red-500/5' : ''}`}>
                  <td className="p-3 font-mono text-xs">{it.game_id}</td>
                  <td className="p-3">{it.package_name}</td>
                  <td className="p-3">
                    <input type="number" value={e.stock}
                      onChange={ev => setEdit({ ...edit, [it.id]: { ...e, stock: +ev.target.value } })}
                      className="w-20 px-2 py-1 rounded bg-muted border border-border" />
                  </td>
                  <td className="p-3">
                    <input type="number" value={e.low_threshold}
                      onChange={ev => setEdit({ ...edit, [it.id]: { ...e, low_threshold: +ev.target.value } })}
                      className="w-20 px-2 py-1 rounded bg-muted border border-border" />
                  </td>
                  <td className="p-3 text-end">
                    <button onClick={() => save(it.game_id, it.package_name, e.stock, e.low_threshold)}
                      className="px-3 py-1 rounded-md bg-primary/15 text-primary text-xs">Save</button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">No inventory items yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
