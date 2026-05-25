import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useProStatus } from '@/hooks/useProStatus';

const ProCompetitionsPage = () => {
  const navigate = useNavigate();
  const { status, loading } = useProStatus();
  if (!loading && !status.is_pro) {
    navigate('/pro', { replace: true });
    return null;
  }
  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4" dir="rtl">
      <button onClick={() => navigate('/pro')} className="flex items-center gap-1 text-muted-foreground text-sm">
        <ChevronLeft size={18} /> رجوع
      </button>
      <div className="glass-card p-10 text-center space-y-3">
        <Trophy size={48} className="text-accent mx-auto" />
        <h2 className="font-display font-bold text-xl text-foreground">المسابقات</h2>
        <p className="text-sm text-muted-foreground">قريباً</p>
      </div>
    </div>
  );
};
export default ProCompetitionsPage;
