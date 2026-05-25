import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminProfilePage = () => {
  const { phoneNumber, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

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
