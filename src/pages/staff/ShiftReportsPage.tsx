import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';

const ShiftReportsPage = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [s, h] = await Promise.all([
        supabase.from('staff_sessions').select('*').order('started_at', { ascending: false }).limit(100),
        supabase.from('handovers').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      setSessions(s.data ?? []);
      setHandovers(h.data ?? []);
    })();
  }, []);

  const durationMin = (a: string, b: string | null) => {
    const end = b ? new Date(b).getTime() : Date.now();
    return Math.round((end - new Date(a).getTime()) / 60000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-primary" />
        <h1 className="font-display font-bold text-xl">Shift Reports</h1>
      </div>

      <div className="glass-card overflow-hidden">
        <h2 className="p-3 border-b border-border text-sm font-bold">Recent Sessions</h2>
        <table className="w-full text-xs">
          <thead className="bg-muted/40 uppercase"><tr>
            <th className="text-start p-2">User</th><th className="text-start p-2">Started</th><th className="text-start p-2">Ended</th><th className="text-start p-2">Duration</th><th className="text-start p-2">Reason</th>
          </tr></thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-2 font-mono">{s.user_id.slice(0, 8)}</td>
                <td className="p-2">{new Date(s.started_at).toLocaleString()}</td>
                <td className="p-2">{s.ended_at ? new Date(s.ended_at).toLocaleString() : <span className="text-green-400">● Active</span>}</td>
                <td className="p-2">{durationMin(s.started_at, s.ended_at)} min</td>
                <td className="p-2">{s.ended_reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card overflow-hidden">
        <h2 className="p-3 border-b border-border text-sm font-bold">Handovers</h2>
        <table className="w-full text-xs">
          <thead className="bg-muted/40 uppercase"><tr>
            <th className="text-start p-2">From</th><th className="text-start p-2">To</th><th className="text-start p-2">Notes</th><th className="text-start p-2">Created</th><th className="text-start p-2">Acked</th>
          </tr></thead>
          <tbody>
            {handovers.map(h => (
              <tr key={h.id} className="border-t border-border">
                <td className="p-2 font-mono">{h.from_user.slice(0, 8)}</td>
                <td className="p-2 font-mono">{h.to_user?.slice(0, 8) ?? '—'}</td>
                <td className="p-2 max-w-md whitespace-pre-wrap">{h.notes}</td>
                <td className="p-2">{new Date(h.created_at).toLocaleString()}</td>
                <td className="p-2">{h.acknowledged_at ? new Date(h.acknowledged_at).toLocaleString() : <span className="text-yellow-400">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftReportsPage;
