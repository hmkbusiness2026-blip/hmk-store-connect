import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut, User, Shield, Crown, Star, Gamepad2, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FavoriteGameModal from '@/components/FavoriteGameModal';
import DigitsInput from '@/components/DigitsInput';
import { useGameProfile } from '@/hooks/useGameProfile';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const gameLabel = (id: string | null, lang: 'ar' | 'en') => {
  if (id === 'hok') return lang === 'ar' ? 'هونر أوف كينجز' : 'Honor of Kings';
  if (id === 'mlbb') return lang === 'ar' ? 'موبايل ليجندز' : 'Mobile Legends';
  return lang === 'ar' ? 'لم يتم الاختيار' : 'Not set';
};

const ProfilePage = () => {
  const { user, phoneNumber, userRole, favoriteGame, setFavoriteGame, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { toast } = useToast();
  const { data: gameData, save: saveGame, loading: gameLoading } = useGameProfile();

  const [mlbbId, setMlbbId] = useState('');
  const [mlbbServer, setMlbbServer] = useState('');
  const [hokUid, setHokUid] = useState('');
  const [savingMlbb, setSavingMlbb] = useState(false);
  const [savingHok, setSavingHok] = useState(false);

  useEffect(() => {
    setMlbbId(gameData.mlbb_id);
    setMlbbServer(gameData.mlbb_server);
    setHokUid(gameData.hok_uid);
  }, [gameData]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const saveMlbb = async () => {
    setSavingMlbb(true);
    const { error } = await saveGame({ mlbb_id: mlbbId, mlbb_server: mlbbServer });
    setSavingMlbb(false);
    if (error) return toast({ title: 'خطأ في الحفظ', variant: 'destructive' });
    toast({ title: 'تم حفظ بيانات Mobile Legends' });
  };

  const saveHok = async () => {
    setSavingHok(true);
    const { error } = await saveGame({ hok_uid: hokUid });
    setSavingHok(false);
    if (error) return toast({ title: 'خطأ في الحفظ', variant: 'destructive' });
    toast({ title: 'تم حفظ بيانات Honor of Kings' });
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-4 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-lg text-foreground">{t('profile')}</h1>

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <User size={24} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">{phoneNumber}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole || 'client'}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full glass-card p-4 flex items-center gap-3 text-start hover:border-primary/40 transition-colors"
      >
        <Star size={20} className="text-primary fill-primary" />
        <div className="flex-1">
          <p className="font-display font-semibold text-sm text-foreground">
            {lang === 'ar' ? 'اللعبة المفضلة' : 'Favorite Game'}
          </p>
          <p className="text-xs text-muted-foreground">{gameLabel(favoriteGame, lang)}</p>
        </div>
        <span className="text-xs font-display font-bold text-primary">
          {lang === 'ar' ? 'تغيير' : 'Change'}
        </span>
      </button>

      {user && (
        <div className="glass-card p-4 space-y-4" dir="rtl">
          <div className="flex items-center gap-2">
            <Gamepad2 size={18} className="text-primary" />
            <h2 className="font-display font-extrabold text-sm">بيانات ألعابي</h2>
            <span className="text-[10px] text-muted-foreground">(اختياري)</span>
          </div>

          {/* Mobile Legends */}
          <div className="space-y-2 pb-3 border-b border-border">
            <p className="font-display font-bold text-xs text-foreground">Mobile Legends</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">الآيدي</label>
                <DigitsInput value={mlbbId} onChange={setMlbbId} placeholder="123456789" maxLength={15} disabled={gameLoading} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">السيرفر</label>
                <DigitsInput value={mlbbServer} onChange={setMlbbServer} placeholder="1234" maxLength={8} disabled={gameLoading} />
              </div>
            </div>
            <Button onClick={saveMlbb} disabled={savingMlbb || gameLoading} size="sm" className="w-full mt-2">
              {savingMlbb ? <Loader2 size={14} className="animate-spin" /> : <><Save size={12} className="mr-1" /> حفظ</>}
            </Button>
          </div>

          {/* Honor of Kings */}
          <div className="space-y-2">
            <p className="font-display font-bold text-xs text-foreground">Honor of Kings</p>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">معرف اللاعب (UID)</label>
              <DigitsInput value={hokUid} onChange={setHokUid} placeholder="123456789" maxLength={15} disabled={gameLoading} />
            </div>
            <Button onClick={saveHok} disabled={savingHok || gameLoading} size="sm" className="w-full mt-2">
              {savingHok ? <Loader2 size={14} className="animate-spin" /> : <><Save size={12} className="mr-1" /> حفظ</>}
            </Button>
          </div>
        </div>
      )}


      {(userRole === 'admin' || (userRole as string) === 'owner') && (
        <button
          onClick={() => navigate('/admin')}
          className="w-full glass-card p-4 flex items-center gap-3 text-start"
        >
          <Shield size={20} className="text-accent" />
          <div>
            <p className="font-display font-semibold text-sm text-foreground">{t('adminDashboard')}</p>
            <p className="text-xs text-muted-foreground">{t('manageOrders')}</p>
          </div>
        </button>
      )}

      {(userRole as string) === 'owner' && (
        <button
          onClick={() => navigate('/owner')}
          className="w-full glass-card p-4 flex items-center gap-3 text-start"
        >
          <Crown size={20} className="text-accent" />
          <div>
            <p className="font-display font-semibold text-sm text-foreground">{t('ownerDashboard')}</p>
            <p className="text-xs text-muted-foreground">{t('manageUsers')}</p>
          </div>
        </button>
      )}

      <button
        onClick={handleSignOut}
        className="w-full glass-card p-4 flex items-center gap-3 text-destructive"
      >
        <LogOut size={20} />
        <span className="font-display font-semibold text-sm">{t('signOut')}</span>
      </button>

      <FavoriteGameModal
        open={pickerOpen}
        dismissible
        onClose={() => setPickerOpen(false)}
        onSelect={async (id) => {
          await setFavoriteGame(id);
          setPickerOpen(false);
        }}
      />
    </div>
  );
};

export default ProfilePage;
