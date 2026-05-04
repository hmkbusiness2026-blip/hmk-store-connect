import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Users, Shield, KeyRound } from 'lucide-react';

const ROLES = ['client', 'moderator', 'admin', 'owner'];

const StaffManagementPage = () => {
  const { isOwner } = usePermissions();
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [target, setTarget] = useState('');
  const [newRole, setNewRole] = useState('moderator');
  const [cdLabel, setCdLabel] = useState('');
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const load = async () => {
    const [r, s, p] = await Promise.all([
      supabase.from('user_roles').select('*'),
      supabase.from('staff_sessions').select('*').is('ended_at', null),
      supabase.from('profiles').select('user_id, phone'),
    ]);
    setRoles(r.data ?? []);
    setSessions(s.data ?? []);
    const map: Record<string, any> = {};
    (p.data ?? []).forEach(pr => { map[pr.user_id] = pr; });
    setProfiles(map);
  };

  useEffect(() => { load(); }, []);

  const assign = async () => {
    if (!target) return;
    const { error, data } = await supabase.functions.invoke('staff-action', {
      body: { action: 'role_assign', payload: { user_id: target, role: newRole } },
    });
    if (error || (data as any)?.error) {
      toast({ title: (data as any)?.error ?? 'Failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Role assigned' });
    setTarget('');
    load();
  };

  const issueKey = async () => {
    if (!target) return;
    const { error, data } = await supabase.functions.invoke('verify-cdkey', {
      body: { op: 'issue', user_id: target, label: cdLabel },
    });
    if (error || (data as any)?.error) {
      toast({ title: (data as any)?.error ?? 'Failed', variant: 'destructive' });
      return;
    }
    setIssuedKey((data as any).code);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-primary" />
        <h1 className="font-display font-bold text-xl">Staff Management</h1>
      </div>

      {isOwner && (
        <div className="glass-card p-4 space-y-3">
          <h2 className="font-bold text-sm flex items-center gap-2"><Shield size={14} /> Assign Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input placeholder="Target user UUID" value={target} onChange={e => setTarget(e.target.value)}
              className="px-3 py-2 rounded-md bg-muted border border-border text-sm font-mono" />
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              className="px-3 py-2 rounded-md bg-muted border border-border text-sm">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={assign} disabled={!target}
              className="px-4 py-2 rounded-md gradient-cyan-purple text-primary-foreground text-sm font-bold disabled:opacity-40">Assign</button>
          </div>

          <h2 className="font-bold text-sm flex items-center gap-2 mt-4"><KeyRound size={14} /> Issue CD Key</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input placeholder="Label (optional)" value={cdLabel} onChange={e => setCdLabel(e.target.value)}
              className="px-3 py-2 rounded-md bg-muted border border-border text-sm" />
            <button onClick={issueKey} disabled={!target} className="px-4 py-2 rounded-md bg-primary/15 text-primary text-sm font-bold disabled:opacity-40 md:col-start-3">Issue Key</button>
          </div>
          {issuedKey && (
            <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/40 text-xs">
              <p className="font-bold text-yellow-400 mb-1">Save this key now — it won't be shown again:</p>
              <p className="font-mono text-base">{issuedKey}</p>
            </div>
          )}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <h2 className="p-3 border-b border-border font-bold text-sm">Roles ({roles.length})</h2>
        <table className="w-full text-xs">
          <thead className="bg-muted/40 uppercase"><tr>
            <th className="text-start p-2">User</th><th className="text-start p-2">Phone</th><th className="text-start p-2">Role</th><th className="text-start p-2">Online</th>
          </tr></thead>
          <tbody>
            {roles.map(r => {
              const online = sessions.find(s => s.user_id === r.user_id);
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2 font-mono">{r.user_id.slice(0, 8)}</td>
                  <td className="p-2">{profiles[r.user_id]?.phone ?? '—'}</td>
                  <td className="p-2"><span className="px-2 py-0.5 rounded bg-primary/15 text-primary">{r.role}</span></td>
                  <td className="p-2">
                    {online ? <span className="text-green-400">● {online.is_idle ? 'Idle' : 'Active'}</span> : <span className="text-muted-foreground">Offline</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagementPage;
