import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from './usePermissions';
import { useToast } from './use-toast';

const IDLE_MS = 10 * 60 * 1000;
const PING_MS = 60 * 1000;

export function useStaffPresence() {
  const { isStaff } = usePermissions();
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [elevatedUntil, setElevatedUntil] = useState<string | null>(null);
  const lastInputRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isStaff) return;
    let stopped = false;

    const onInput = () => { lastInputRef.current = Date.now(); };
    window.addEventListener('mousemove', onInput, { passive: true });
    window.addEventListener('keydown', onInput);
    window.addEventListener('touchstart', onInput, { passive: true });

    const start = async () => {
      const { data, error } = await supabase.functions.invoke('staff-session', {
        body: { op: 'start', device_id: navigator.userAgent.slice(0, 64) },
      });
      if (error) {
        toast({ title: 'Session error', description: (error as any).message ?? 'Could not start staff session', variant: 'destructive' });
        return;
      }
      if (data?.session) {
        setActive(true);
        setElevatedUntil(data.session.elevated_until ?? null);
      }
    };

    const ping = async () => {
      const idle = Date.now() - lastInputRef.current > IDLE_MS;
      const { data } = await supabase.functions.invoke('staff-session', { body: { op: 'ping', idle } });
      if ((data as any)?.session) {
        setElevatedUntil((data as any).session.elevated_until ?? null);
      }
      if ((data as any)?.error === 'No active session') {
        setActive(false);
        toast({ title: 'Signed out', description: 'Session opened on another device.', variant: 'destructive' });
      }
    };

    start();
    const t = setInterval(() => { if (!stopped) ping(); }, PING_MS);
    const beacon = () => {
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-session`,
        new Blob([JSON.stringify({ op: 'end', reason: 'unload' })], { type: 'application/json' }),
      );
    };
    window.addEventListener('beforeunload', beacon);

    return () => {
      stopped = true;
      clearInterval(t);
      window.removeEventListener('mousemove', onInput);
      window.removeEventListener('keydown', onInput);
      window.removeEventListener('touchstart', onInput);
      window.removeEventListener('beforeunload', beacon);
    };
  }, [isStaff]);

  const isElevated = !!elevatedUntil && new Date(elevatedUntil) > new Date();

  const endSession = async (handoverNotes?: string) => {
    const { data, error } = await supabase.functions.invoke('staff-session', {
      body: { op: 'end', handover_notes: handoverNotes },
    });
    if (error || (data as any)?.error) {
      return { error: (data as any)?.error ?? (error as any)?.message };
    }
    setActive(false);
    return { ok: true };
  };

  const redeemCdKey = async (code: string) => {
    const { data, error } = await supabase.functions.invoke('verify-cdkey', { body: { op: 'redeem', code } });
    if (error || (data as any)?.error) return { error: (data as any)?.error ?? (error as any)?.message };
    setElevatedUntil((data as any).elevated_until);
    return { ok: true };
  };

  return { active, isElevated, elevatedUntil, endSession, redeemCdKey };
}
