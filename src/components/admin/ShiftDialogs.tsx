import { useState } from 'react';
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

interface RowProps {
  label: string;
  value: string;
  setValue: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
}
const Row = ({ label, value, setValue, note, setNote }: RowProps) => (
  <div className="space-y-1.5">
    <label className="text-xs font-display font-bold">{label}</label>
    <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظات / Notes" className="text-xs min-h-[40px]" />
  </div>
);

export const OpenShiftDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [vaultKey, setVaultKey] = useState('');
  const [smile, setSmile] = useState(''); const [smileNote, setSmileNote] = useState('');
  const [wallet, setWallet] = useState(''); const [walletNote, setWalletNote] = useState('');
  const [insta, setInsta] = useState(''); const [instaNote, setInstaNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!vaultKey) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc('open_shift', {
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
    toast({ title: 'تم افتتاح الشفت' });
    onOpenChange(false); onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>افتتاح الشفت / Open Shift</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-display font-bold">مفتاح الخزنة / Vault Key</label>
            <Input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} />
          </div>
          <Row label="ستارت سمايل / Start Smile" value={smile} setValue={setSmile} note={smileNote} setNote={setSmileNote} />
          <Row label="ستارت محفظة / Start Wallet" value={wallet} setValue={setWallet} note={walletNote} setNote={setWalletNote} />
          <Row label="ستارت انستا / Start InstaPay" value={insta} setValue={setInsta} note={instaNote} setNote={setInstaNote} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !vaultKey}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : 'افتتاح'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CloseShiftDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [vaultKey, setVaultKey] = useState('');
  const [smile, setSmile] = useState(''); const [smileNote, setSmileNote] = useState('');
  const [wallet, setWallet] = useState(''); const [walletNote, setWalletNote] = useState('');
  const [insta, setInsta] = useState(''); const [instaNote, setInstaNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await (supabase as any).rpc('close_shift', {
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
    toast({ title: 'تم انهاء الشفت' });
    onOpenChange(false); onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>انهاء الشفت / End Shift</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-display font-bold">مفتاح الخزنة / Vault Key</label>
            <Input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} />
          </div>
          <Row label="اند سمايل / End Smile" value={smile} setValue={setSmile} note={smileNote} setNote={setSmileNote} />
          <Row label="اند محفظة / End Wallet" value={wallet} setValue={setWallet} note={walletNote} setNote={setWalletNote} />
          <Row label="اند انستا باي / End InstaPay" value={insta} setValue={setInsta} note={instaNote} setNote={setInstaNote} />
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={submit} disabled={busy || !vaultKey}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : 'انهاء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
