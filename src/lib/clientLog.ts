import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget client-side audit logger. Calls the SECURITY DEFINER
 * `public.log_event` RPC. Never throws — logging must never break user flow.
 */
export const logEvent = async (
  eventType: 'auth' | 'order' | 'shift' | 'handover' | 'security' | 'system',
  action: string,
  details: Record<string, unknown> = {},
) => {
  try {
    await (supabase as any).rpc('log_event', {
      _event_type: eventType,
      _action: action,
      _details: details,
    });
  } catch {
    /* swallow */
  }
};
