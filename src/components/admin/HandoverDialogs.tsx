import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

interface AdminOption { user_id: string; full_name: string }

const RowField = ({ label, value, setValue, note, setNote }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-display font-bold">{label}</label>
    <Input type="number" inputMode="decimal" value={value} onChange={(e: any) => setValue(e.target.value)} placeholder="0" />
    <Textarea value={note} onChange={(e: any) => setNote(e.target.value)} placeholder="ملاحظات / Notes" className="text-xs min-h-[40px]" />
  </div>
);

export const HandoverRequestDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [toAdmin, setToAdmin] = useState('');
  const [vaultKey, setVaultKey] = useState('');
  const [smile, setSmile] = useState(''); const [smileNote, setSmileNote] = useState('');
  const [wallet, setWallet] = useState(''); const [walletNote, setWalletNote] = useState('');
  const [insta, setInsta] = useState(''); const [instaNote, setInstaNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (supabase as any).rpc('list_admins').then(({ data }: any) => setAdmins(data ?? []));
  }, [open]);

  const submit = async () => {
    setBusy(true);
    const { error } = await (supabase as any).rpc('request_handover', {
      _to_admin: toAdmin,
      _vault_key: vaultKey,
      _end_smile: Number(smile) || 0,
      _end_wallet: Number(wallet) || 0,
      _end_instapay: Number(insta) || 0,
      _end_smile_note: smileNote || null,
      _end_wallet_note: walletNote || null,
      _end_instapay_note: instaNote || null,
    });
    setBusy(false);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم إرسال طلب التسليم', description: 'بانتظار قبول الادمن الآخر' });
    onOpenChange(false); onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تسليم الشفت / Handover</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-display font-bold">اختر الادمن / Target Admin</label>
            <select
              value={toAdmin}
              onChange={(e) => setToAdmin(e.target.value)}
              className="w-full h-10 rounded-md bg-muted border border-input px-3 text-sm"
            >
              <option value="">—</option>
              {admins.map(a => <option key={a.user_id} value={a.user_id}>{a.full_name || a.user_id.slice(0, 8)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-display font-bold">مفتاحك / Your Vault Key</label>
            <Input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} />
          </div>
          <p className="text-[11px] text-muted-foreground">أدخل القيم الختامية لشفتك الحالي. الادمن المستلم سيُدخل مفتاحه وقيم البداية.</p>
          <RowField label="اند سمايل" value={smile} setValue={setSmile} note={smileNote} setNote={setSmileNote} />
          <RowField label="اند محفظة" value={wallet} setValue={setWallet} note={walletNote} setNote={setWalletNote} />
          <RowField label="اند انستا باي" value={insta} setValue={setInsta} note={instaNote} setNote={setInstaNote} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !toAdmin || !vaultKey}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : 'إرسال طلب التسليم'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AcceptProps extends Props { handoverId: string | null }

export const HandoverAcceptDialog = ({ open, onOpenChange, onSuccess, handoverId }: AcceptProps) => {
  const { toast } = useToast();
  const [vaultKey, setVaultKey] = useState('');
  const [smile, setSmile] = useState(''); const [smileNote, setSmileNote] = useState('');
  const [wallet, setWallet] = useState(''); const [walletNote, setWalletNote] = useState('');
  const [insta, setInsta] = useState(''); const [instaNote, setInstaNote] = useState('');
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    if (!handoverId) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc('accept_handover', {
      _handover_id: handoverId,
      _vault_key: vaultKey,
      _start_smile: Number(smile) || 0,
      _start_wallet: Number(wallet) || 0,
      _start_instapay: Number(insta) || 0,
      _start_smile_note: smileNote || null,
      _start_wallet_note: walletNote || null,
      _start_instapay_note: instaNote || null,
    });
    setBusy(false);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم قبول التسليم' });
    onOpenChange(false); onSuccess();
  };

  const reject = async () => {
    if (!handoverId) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc('reject_handover', { _handover_id: handoverId, _vault_key: vaultKey });
    setBusy(false);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم رفض التسليم' });
    onOpenChange(false); onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>قبول تسليم الشفت / Accept Handover</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-display font-bold">مفتاحك / Your Vault Key</label>
            <Input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} />
          </div>
          <RowField label="ستارت سمايل" value={smile} setValue={setSmile} note={smileNote} setNote={setSmileNote} />
          <RowField label="ستارت محفظة" value={wallet} setValue={setWallet} note={walletNote} setNote={setWalletNote} />
          <RowField label="ستارت انستا" value={insta} setValue={setInsta} note={instaNote} setNote={setInstaNote} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={reject} disabled={busy || !vaultKey}>رفض</Button>
          <Button onClick={accept} disabled={busy || !vaultKey}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : 'قبول'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
