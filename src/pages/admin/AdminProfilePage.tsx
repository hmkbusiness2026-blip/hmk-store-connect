import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield, History, Save, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AdminProfilePage = () => {
  const { user, phoneNumber, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [vodafone, setVodafone] = useState('');
  const [instapay, setInstapay] = useState('');
  const [vaultKey, setVaultKey] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVault, setSavingVault] = useState(false);
  const [hasVault, setHasVault] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('admin_profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }: any) => {
      if (data) {
        setFullName(data.full_name ?? '');
        setVodafone(data.vodafone_cash ?? '');
        setInstapay(data.instapay_id ?? '');
        setHasVault(!!data.vault_key_hash);
      }
    });
  }, [user]);

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await (supabase as any).rpc('update_admin_profile', {
      _full_name: fullName, _vodafone: vodafone, _instapay: instapay,
    });
    setSavingProfile(false);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم الحفظ' });
  };

  const saveVault = async () => {
    if (vaultKey.length < 4) { toast({ title: 'مفتاح قصير جداً', variant: 'destructive' }); return; }
    setSavingVault(true);
    const { error } = await (supabase as any).rpc('set_vault_key', { _key: vaultKey });
    setSavingVault(false);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setVaultKey(''); setHasVault(true);
    toast({ title: 'تم حفظ مفتاح الخزنة' });
  };

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <Shield size={24} />
        </div>
        <div>
          <p className="font-display font-bold">{phoneNumber || 'Admin'}</p>
          <p className="text-xs text-muted-foreground">{userRole === 'owner' ? 'مالك' : 'مسؤول'}</p>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h3 className="font-display font-extrabold text-sm">بيانات الادمن / Admin Details</h3>
        <div className="space-y-2">
          <label className="text-xs font-display font-bold">الاسم / Full Name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-display font-bold">رقم محفظة فودافون كاش / Vodafone Cash</label>
          <Input value={vodafone} onChange={(e) => setVodafone(e.target.value)} inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-display font-bold">عنوان انستا باي / InstaPay ID</label>
          <Input value={instapay} onChange={(e) => setInstapay(e.target.value)} />
        </div>
        <Button onClick={saveProfile} disabled={savingProfile} className="w-full">
          {savingProfile ? <Loader2 className="animate-spin" size={16} /> : <><Save size={14} className="mr-1" /> حفظ البيانات</>}
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
        onClick={() => navigate('/admin/history')}
        className="w-full glass-card p-4 text-start text-sm font-display font-bold flex items-center gap-2"
      >
        <History size={16} /> تاريخ العمل / Work History
      </button>

      <button
        onClick={() => navigate('/admin/customize')}
        className="w-full glass-card p-4 text-start text-sm font-display font-bold"
      >
        تخصيص الموقع
      </button>

      <button
        onClick={handleSignOut}
        className="w-full glass-card p-4 text-start text-sm font-display font-bold text-destructive flex items-center gap-2"
      >
        <LogOut size={16} /> تسجيل الخروج
      </button>
    </div>
  );
};

export default AdminProfilePage;
