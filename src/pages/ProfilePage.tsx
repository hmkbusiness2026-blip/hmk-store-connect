import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut, User, Shield, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FavoriteGameModal from '@/components/FavoriteGameModal';

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
