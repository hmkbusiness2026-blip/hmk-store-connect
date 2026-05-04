import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, CheckCheck, UserCheck } from 'lucide-react';

interface Msg {
  id: string;
  customer_id: string;
  body: string;
  direction: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  order_id: string | null;
}

const triageColor = (status: string, priority: string) => {
  if (priority === 'urgent') return 'border-red-500/60 bg-red-500/5';
  if (status === 'new') return 'border-yellow-500/60 bg-yellow-500/5';
  if (status === 'open') return 'border-blue-500/60 bg-blue-500/5';
  return 'border-green-500/40 bg-green-500/5';
};

const InboxPage = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [active, setActive] = useState<Msg | null>(null);
  const [reply, setReply] = useState('');
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(200);
    setMessages((data ?? []) as Msg[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('inbox-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const callAction = async (action: string, body: any) => {
    const { error, data } = await supabase.functions.invoke('staff-action', { body: { action, ...body } });
    if (error || (data as any)?.error) {
      toast({ title: (data as any)?.error ?? error?.message ?? 'Action failed', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const assignToMe = async (m: Msg) => { if (await callAction('message_assign', { ids: [m.id] })) load(); };
  const close = async (m: Msg) => { if (await callAction('message_close', { ids: [m.id] })) { setActive(null); load(); } };
  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    if (await callAction('message_reply', { payload: { customer_id: active.customer_id, order_id: active.order_id, body: reply } })) {
      setReply('');
      load();
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-96 border-e border-border overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          <h2 className="font-display font-bold text-sm">Inbox · {messages.length}</h2>
        </div>
        {messages.length === 0 && <p className="p-4 text-xs text-muted-foreground">No messages yet.</p>}
        {messages.map(m => (
          <button key={m.id} onClick={() => setActive(m)}
            className={`w-full text-start p-3 border-s-4 border-b border-border ${triageColor(m.status, m.priority)} ${active?.id === m.id ? 'bg-muted/40' : 'hover:bg-muted/20'}`}>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="uppercase">{m.status} · {m.direction}</span>
              <span>{new Date(m.created_at).toLocaleTimeString()}</span>
            </div>
            <p className="text-xs line-clamp-2">{m.body}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Customer · {active.customer_id?.slice(0, 8)}</p>
                <p className="font-display font-bold text-sm">Status: {active.status}</p>
              </div>
              <button onClick={() => assignToMe(active)} className="px-3 py-1.5 rounded-md bg-muted text-xs flex items-center gap-1">
                <UserCheck size={12} /> Take
              </button>
              <button onClick={() => close(active)} className="px-3 py-1.5 rounded-md bg-green-500/15 text-green-400 text-xs flex items-center gap-1">
                <CheckCheck size={12} /> Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.filter(m => m.customer_id === active.customer_id).reverse().map(m => (
                <div key={m.id} className={`max-w-md p-3 rounded-lg text-sm ${m.direction === 'inbound' ? 'bg-muted me-auto' : 'gradient-cyan-purple text-primary-foreground ms-auto'}`}>
                  {m.body}
                  <div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()}
                placeholder="Type a reply..." className="flex-1 px-3 py-2 rounded-md bg-muted border border-border text-sm" />
              <button onClick={sendReply} disabled={!reply.trim()}
                className="px-4 py-2 rounded-md gradient-cyan-purple text-primary-foreground text-sm font-bold disabled:opacity-40 flex items-center gap-1">
                <Send size={12} /> Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
