import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Crown, LogOut, Save, Loader2, KeyRound, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const OwnerProfilePage = () => {
  const { user, phoneNumber, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [vodafone, setVodafone] = useState('');
  const [instapay, setInstapay] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [vaultKey, setVaultKey] = useState('');
  const [hasVault, setHasVault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [savingVault, setSavingVault] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('admin_profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }: any) => {
      if (data) {
        setFullName(data.full_name ?? '');
        setVodafone(data.vodafone_cash ?? '');
        setInstapay(data.instapay_id ?? '');
        setTransferNumber(data.transfer_number ?? '');
        setHasVault(!!data.vault_key_hash);
      }
    });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await (supabase as any).rpc('update_admin_profile', {
      _full_name: fullName, _vodafone: vodafone, _instapay: instapay,
    });
    setSaving(false);
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    toast({ title: 'تم الحفظ' });
  };

  const saveTransfer = async () => {
    setSavingTransfer(true);
    const { error } = await (supabase as any).rpc('update_owner_transfer_number', { _transfer_number: transferNumber });
    setSavingTransfer(false);
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    toast({ title: 'تم حفظ رقم التحويل' });
  };

  const saveVault = async () => {
    if (vaultKey.length < 4) return toast({ title: 'مفتاح قصير جداً', variant: 'destructive' });
    setSavingVault(true);
    const { error } = await (supabase as any).rpc('set_vault_key', { _key: vaultKey });
    setSavingVault(false);
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    setVaultKey(''); setHasVault(true);
    toast({ title: 'تم حفظ مفتاح الخزنة' });
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 flex items-center gap-3 border border-primary/30">
        <div className="w-14 h-14 rounded-full gradient-fire flex items-center justify-center shadow-[0_0_20px_rgba(255,176,0,0.5)]">
          <Crown size={26} className="text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-bold">{phoneNumber || 'Owner'}</p>
          <p className="text-xs text-primary text-glow-gold">مالك / OWNER</p>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h3 className="font-display font-extrabold text-sm">بيانات المالك</h3>
        <div className="space-y-2">
          <label className="text-xs font-display font-bold">الاسم / Full Name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-display font-bold">رقم محفظة فودافون كاش</label>
          <Input value={vodafone} onChange={(e) => setVodafone(e.target.value)} inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-display font-bold">عنوان انستا باي</label>
          <Input value={instapay} onChange={(e) => setInstapay(e.target.value)} />
        </div>
        <Button onClick={saveProfile} disabled={saving} className="w-full">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={14} className="mr-1" /> حفظ البيانات</>}
        </Button>
      </div>

      <div className="glass-card p-4 space-y-3 border border-accent/30">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-accent" />
          <h3 className="font-display font-extrabold text-sm">رقم التحويل / Transfer Number</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          الرقم المعتمد لتوجيه التحويلات في النظام.
        </p>
        <Input
          value={transferNumber}
          onChange={(e) => setTransferNumber(e.target.value)}
          inputMode="numeric"
          placeholder="01xxxxxxxxx"
        />
        <Button onClick={saveTransfer} disabled={savingTransfer} className="w-full" variant="secondary">
          {savingTransfer ? <Loader2 className="animate-spin" size={16} /> : 'حفظ رقم التحويل'}
        </Button>
      </div>

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-primary" />
          <h3 className="font-display font-extrabold text-sm">مفتاح الخزنة / Vault Key</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {hasVault ? 'تم تعيين مفتاح الخزنة. يمكنك تغييره بإدخال مفتاح جديد.' : 'يجب تعيين مفتاح الخزنة قبل افتتاح أي شفت.'}
        </p>
        <Input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="••••" />
        <Button onClick={saveVault} disabled={savingVault} className="w-full" variant="secondary">
          {savingVault ? <Loader2 className="animate-spin" size={16} /> : 'حفظ المفتاح'}
        </Button>
      </div>

      <button
        onClick={async () => { await signOut(); navigate('/auth'); }}
        className="w-full glass-card p-4 text-start text-sm font-display font-bold text-destructive flex items-center gap-2"
      >
        <LogOut size={16} /> تسجيل الخروج
      </button>
    </div>
  );
};

export default OwnerProfilePage;
