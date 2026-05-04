import { ReactNode, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Inbox, Users, Package, ScrollText, Calendar, Settings, LogOut, Shield, KeyRound, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useStaffPresence } from '@/hooks/useStaffPresence';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface NavItem { to: string; label: string; icon: any; roles?: ('moderator' | 'admin' | 'owner')[]; }

const NAV: NavItem[] = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/staff/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/staff/inbox', label: 'Inbox', icon: Inbox },
  { to: '/staff/inventory', label: 'Inventory', icon: Package },
  { to: '/staff/audit', label: 'Audit Logs', icon: ScrollText, roles: ['admin', 'owner'] },
  { to: '/staff/staff', label: 'Staff', icon: Users, roles: ['admin', 'owner'] },
  { to: '/staff/schedules', label: 'Schedules', icon: Calendar, roles: ['admin', 'owner'] },
  { to: '/staff/customize', label: 'Site Config', icon: Settings, roles: ['admin', 'owner'] },
];

const StaffLayout = () => {
  const { signOut } = useAuth();
  const { isStaff, role, isOwner } = usePermissions();
  const { active, isElevated, elevatedUntil, endSession, redeemCdKey } = useStaffPresence();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showHandover, setShowHandover] = useState(false);
  const [handover, setHandover] = useState('');
  const [showCdKey, setShowCdKey] = useState(false);
  const [cdKey, setCdKey] = useState('');
  const [unackedHandover, setUnackedHandover] = useState<any>(null);

  useEffect(() => {
    if (!isStaff) return;
    const fetch = async () => {
      const { data } = await supabase.from('handovers').select('*').is('acknowledged_at', null).order('created_at', { ascending: false }).limit(1);
      if (data && data[0]) setUnackedHandover(data[0]);
    };
    fetch();
    const ch = supabase.channel('handovers-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'handovers' }, (p: any) => setUnackedHandover(p.new))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isStaff]);

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-6 text-center">
          <Shield size={40} className="mx-auto text-destructive mb-2" />
          <p className="font-display font-bold">Access Denied</p>
          <p className="text-sm text-muted-foreground">Staff role required.</p>
        </div>
      </div>
    );
  }

  const handleClockOut = async () => {
    if (role === 'moderator') { setShowHandover(true); return; }
    const r = await endSession();
    if ((r as any)?.error) { toast({ title: (r as any).error, variant: 'destructive' }); return; }
    await signOut();
    navigate('/');
  };

  const submitHandover = async () => {
    const r = await endSession(handover);
    if ((r as any)?.error) { toast({ title: (r as any).error, variant: 'destructive' }); return; }
    setShowHandover(false);
    await signOut();
    navigate('/');
  };

  const submitCdKey = async () => {
    const r = await redeemCdKey(cdKey);
    if ((r as any)?.error) { toast({ title: (r as any).error, variant: 'destructive' }); return; }
    setShowCdKey(false);
    setCdKey('');
    toast({ title: 'CD key accepted — elevated for 15 min' });
  };

  const ackHandover = async () => {
    if (!unackedHandover) return;
    await supabase.functions.invoke('staff-action', { body: { action: 'handover_ack', ids: [unackedHandover.id] } });
    setUnackedHandover(null);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-56 border-e border-border bg-card/40 backdrop-blur flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="font-display font-bold text-sm gradient-text">HMK STAFF</h1>
          <p className="text-[10px] text-muted-foreground uppercase">{role}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV.filter(n => !n.roles || n.roles.includes(role as any)).map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
              <n.icon size={14} /> {n.label}
            </NavLink>
          ))}
          {isOwner && (
            <NavLink to="/staff/shifts" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm ${isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted'}`}>
              <Clock size={14} /> Shift Reports
            </NavLink>
          )}
        </nav>
        <div className="p-2 border-t border-border space-y-2">
          <div className="px-2 text-[10px] flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            <span className="text-muted-foreground">{active ? 'On Duty' : 'Off Duty'}</span>
            {isElevated && <span className="ms-auto text-primary">★ Elevated</span>}
          </div>
          <button onClick={() => setShowCdKey(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-muted text-muted-foreground">
            <KeyRound size={12} /> Enter CD Key
          </button>
          <button onClick={handleClockOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-destructive/15 text-destructive">
            <LogOut size={12} /> Clock Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>

      {showHandover && (
        <Modal title="Clock Out — Handover Notes" onClose={() => setShowHandover(false)}>
          <p className="text-xs text-muted-foreground mb-2">A replacement must be online and you must leave a handover note.</p>
          <textarea value={handover} onChange={e => setHandover(e.target.value)} rows={5}
            placeholder="Pending: 3 orders awaiting receipts. Customer #42 expecting refund."
            className="w-full px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          <div className="flex gap-2 mt-3">
            <button onClick={submitHandover} disabled={handover.length < 5}
              className="flex-1 py-2 rounded-md gradient-cyan-purple text-primary-foreground text-sm font-bold disabled:opacity-40">Submit & Clock Out</button>
            <button onClick={() => setShowHandover(false)} className="px-4 py-2 rounded-md bg-muted text-sm">Cancel</button>
          </div>
        </Modal>
      )}

      {showCdKey && (
        <Modal title="Elevation Required" onClose={() => setShowCdKey(false)}>
          <p className="text-xs text-muted-foreground mb-2">Enter your one-time CD key to unlock high-stakes actions for 15 minutes.</p>
          <input value={cdKey} onChange={e => setCdKey(e.target.value.toUpperCase())} autoFocus
            placeholder="XXXXXXXXXXXXXXXX" className="w-full px-3 py-2 rounded-md bg-muted border border-border text-sm font-mono" />
          <button onClick={submitCdKey} disabled={cdKey.length < 8}
            className="w-full mt-3 py-2 rounded-md gradient-cyan-purple text-primary-foreground text-sm font-bold disabled:opacity-40">Redeem</button>
        </Modal>
      )}

      {unackedHandover && (
        <Modal title="Handover from previous shift" onClose={() => {}}>
          <p className="text-sm whitespace-pre-wrap mb-3">{unackedHandover.notes}</p>
          <p className="text-[10px] text-muted-foreground mb-3">{new Date(unackedHandover.created_at).toLocaleString()}</p>
          <button onClick={ackHandover} className="w-full py-2 rounded-md gradient-cyan-purple text-primary-foreground text-sm font-bold">Acknowledge</button>
        </Modal>
      )}
    </div>
  );
};

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-card p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-bold text-sm mb-3">{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}

export default StaffLayout;
