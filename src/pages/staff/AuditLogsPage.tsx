import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollText } from 'lucide-react';

interface Log { id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; before: any; after: any; created_at: string; }

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500);
      setLogs((data ?? []) as Log[]);
    })();
  }, []);

  const visible = logs.filter(l => !filter || l.action.includes(filter) || l.entity_type.includes(filter));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText size={18} className="text-primary" />
        <h1 className="font-display font-bold text-xl">Audit Logs</h1>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by action or entity..."
        className="w-full md:w-80 px-3 py-2 rounded-md bg-muted border border-border text-sm" />

      <div className="glass-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 uppercase">
            <tr>
              <th className="text-start p-2">Time</th>
              <th className="text-start p-2">Actor</th>
              <th className="text-start p-2">Action</th>
              <th className="text-start p-2">Entity</th>
              <th className="text-start p-2">ID</th>
            </tr>
          </thead>
          {visible.map(l => (
            <tbody key={l.id}>
              <tr onClick={() => setOpen(open === l.id ? null : l.id)} className="border-t border-border cursor-pointer hover:bg-muted/20">
                <td className="p-2 font-mono">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-2 font-mono">{l.actor_id?.slice(0, 8) ?? '—'}</td>
                <td className="p-2"><span className="px-2 py-0.5 rounded bg-primary/15 text-primary">{l.action}</span></td>
                <td className="p-2">{l.entity_type}</td>
                <td className="p-2 font-mono">{l.entity_id?.slice(0, 8) ?? '—'}</td>
              </tr>
              {open === l.id && (
                <tr className="bg-muted/20"><td colSpan={5} className="p-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Before</p>
                      <pre className="bg-background p-2 rounded text-[10px] overflow-auto max-h-64">{JSON.stringify(l.before, null, 2)}</pre>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">After</p>
                      <pre className="bg-background p-2 rounded text-[10px] overflow-auto max-h-64">{JSON.stringify(l.after, null, 2)}</pre>
                    </div>
                  </div>
                </td></tr>
              )}
            </tbody>
          ))}
          {visible.length === 0 && <tbody><tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No log entries.</td></tr></tbody>}
        </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
