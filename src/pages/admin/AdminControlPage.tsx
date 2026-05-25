import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentShift } from '@/hooks/useCurrentShift';
import { useAuth } from '@/contexts/AuthContext';
import { PlayCircle, ArrowLeftRight, StopCircle, Bell, History, AlertCircle, BookOpen, Smile } from 'lucide-react';
import { OpenShiftDialog, CloseShiftDialog } from '@/components/admin/ShiftDialogs';
import { HandoverRequestDialog, HandoverAcceptDialog } from '@/components/admin/HandoverDialogs';

const AdminControlPage = () => {
  const { user } = useAuth();
  const { myOpenShift, anyOpenShift, pendingIncoming, pendingOutgoing, refresh } = useCurrentShift();

  const [openD, setOpenD] = useState(false);
  const [closeD, setCloseD] = useState(false);
  const [handoverD, setHandoverD] = useState(false);
  const [acceptId, setAcceptId] = useState<string | null>(null);

  const hasOpenMine = !!myOpenShift;
  const hasOpenOther = !!anyOpenShift && anyOpenShift.admin_id !== user?.id;
  const hasOutgoingPending = pendingOutgoing.length > 0;

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">حالة الدوام</p>
            <p className="font-display font-extrabold text-base">
              {hasOpenMine ? 'شفتك مفتوح' : anyOpenShift ? 'شفت آخر مفتوح' : 'لا يوجد شفت مفتوح'}
            </p>
          </div>
          <span className={`w-3 h-3 rounded-full ${anyOpenShift ? 'bg-green-500 shadow-[0_0_10px_2px_rgba(34,197,94,0.7)]' : 'bg-destructive'}`} />
        </div>
      </div>

      {/* Incoming handover */}
      {pendingIncoming.length > 0 && (
        <div className="glass-card p-4 border border-primary/40 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-primary" size={18} />
            <p className="font-display font-extrabold text-sm">طلبات تسليم واردة</p>
          </div>
          {pendingIncoming.map(h => (
            <button
              key={h.id}
              onClick={() => setAcceptId(h.id)}
              className="w-full text-start glass-card p-3 hover:border-primary/60"
            >
              <p className="text-xs">طلب تسليم شفت — اضغط للمراجعة</p>
              <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleString('ar-EG')}</p>
            </button>
          ))}
        </div>
      )}

      {/* Shift ops */}
      <div>
        <h2 className="font-display font-extrabold text-sm mb-2">الدوام / Shift Operations</h2>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setOpenD(true)}
            disabled={!!anyOpenShift}
            className="glass-card p-4 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed text-start"
          >
            <PlayCircle className="text-green-500" />
            <div>
              <p className="font-display font-bold">افتتاح الشفت</p>
              <p className="text-[11px] text-muted-foreground">Open Shift</p>
            </div>
          </button>

          <button
            onClick={() => setHandoverD(true)}
            disabled={!hasOpenMine || hasOutgoingPending}
            className="glass-card p-4 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed text-start"
          >
            <ArrowLeftRight className="text-primary" />
            <div>
              <p className="font-display font-bold">تسليم الشفت {hasOutgoingPending && '(بانتظار القبول)'}</p>
              <p className="text-[11px] text-muted-foreground">Handover</p>
            </div>
          </button>

          <button
            onClick={() => setCloseD(true)}
            disabled={!hasOpenMine}
            className="glass-card p-4 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed text-start"
          >
            <StopCircle className="text-destructive" />
            <div>
              <p className="font-display font-bold">انهاء الشفت</p>
              <p className="text-[11px] text-muted-foreground">End Shift</p>
            </div>
          </button>
        </div>
      </div>

      <Link to="/admin/history" className="block glass-card p-4 flex items-center gap-3">
        <History />
        <div>
          <p className="font-display font-bold">تاريخ العمل</p>
          <p className="text-[11px] text-muted-foreground">Work History</p>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/pro-articles" className="glass-card p-4 flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <div>
            <p className="font-display font-bold text-sm">جداول PRO</p>
            <p className="text-[10px] text-muted-foreground">Event Tables</p>
          </div>
        </Link>
        <Link to="/admin/pro-emotes" className="glass-card p-4 flex items-center gap-2">
          <Smile size={18} className="text-primary" />
          <div>
            <p className="font-display font-bold text-sm">أكواد الإيموتات</p>
            <p className="text-[10px] text-muted-foreground">Emote Codes</p>
          </div>
        </Link>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={18} className="text-primary" />
          <p className="font-display font-extrabold text-sm">الاشعارات المهمة / Important Notifications</p>
        </div>
        <p className="text-xs text-muted-foreground">لا توجد اشعارات حالياً.</p>
      </div>

      {hasOpenOther && (
        <div className="glass-card p-3 text-xs text-muted-foreground">
          الشفت الحالي مفتوح بواسطة ادمن آخر. لا يمكنك افتتاح شفت جديد حتى ينتهي.
        </div>
      )}

      <OpenShiftDialog open={openD} onOpenChange={setOpenD} onSuccess={refresh} />
      <CloseShiftDialog open={closeD} onOpenChange={setCloseD} onSuccess={refresh} />
      <HandoverRequestDialog open={handoverD} onOpenChange={setHandoverD} onSuccess={refresh} />
      <HandoverAcceptDialog open={!!acceptId} onOpenChange={(v) => !v && setAcceptId(null)} onSuccess={refresh} handoverId={acceptId} />
    </div>
  );
};

export default AdminControlPage;
