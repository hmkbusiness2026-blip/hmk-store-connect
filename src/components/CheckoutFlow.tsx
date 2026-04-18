import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, Check, Loader2, Copy, X, LogIn, UserPlus } from 'lucide-react';
import { mlbbServers, mlbbPackages, admins, type PackageItem } from '@/lib/gameData';
import { games } from '@/lib/gameData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useStoreStatus } from '@/hooks/useStoreStatus';

interface CheckoutFlowProps {
  gameId: string;
  onClose: () => void;
}

const CheckoutFlow = ({ gameId, onClose }: CheckoutFlowProps) => {
  const [step, setStep] = useState(1);
  const [server, setServer] = useState('');
  const [uid, setUid] = useState('');
  const [zone, setZone] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<PackageItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'vodafone' | 'instapay' | ''>('');
  const [assignedAdmin, setAssignedAdmin] = useState<typeof admins[0] | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { status: storeStatus } = useStoreStatus();

  const game = games.find(g => g.id === gameId);

  const handleRequestAdmin = async () => {
    setLoadingAdmin(true);
    await new Promise(r => setTimeout(r, 1500));
    const admin = admins[Math.floor(Math.random() * admins.length)];
    setAssignedAdmin(admin);
    setLoadingAdmin(false);
  };

  const handleSubmitOrder = async () => {
    if (!user || !selectedPkg || !assignedAdmin || !receiptFile) return;
    setSubmitting(true);

    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const { error: orderErr } = await supabase.from('orders').insert({
        user_id: user.id,
        game_id: gameId,
        game_name: game?.name,
        server,
        player_uid: uid,
        zone,
        package_name: selectedPkg.name,
        price: selectedPkg.price,
        payment_method: paymentMethod,
        admin_name: assignedAdmin.name,
        receipt_url: publicUrl,
        status: 'pending',
      });

      if (orderErr) throw orderErr;

      // In-app notification for the user
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Order Received',
        message: `Your ${selectedPkg.name} order is being reviewed.`,
        read: false,
      });

      toast({ title: 'Order submitted!', description: 'We\'ll process it shortly.' });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative glass-card w-full max-w-md max-h-[85vh] overflow-y-auto mx-2 mb-20 sm:mb-0 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="font-display font-bold text-foreground">{game?.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 block">Select Server</label>
                <div className="grid grid-cols-2 gap-2">
                  {mlbbServers.map(s => (
                    <button
                      key={s}
                      onClick={() => setServer(s)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        server === s
                          ? 'bg-primary text-primary-foreground glow-cyan'
                          : 'glass-card text-foreground hover:border-primary/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Player UID"
                  value={uid}
                  onChange={e => setUid(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Zone"
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                disabled={!server || !uid}
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-md font-display font-semibold text-sm bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next: Choose Package <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
              {mlbbPackages.map(cat => (
                <div key={cat.category}>
                  <h3 className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">{cat.category}</h3>
                  <div className="space-y-1.5">
                    {cat.packages.map(pkg => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-all ${
                          selectedPkg?.id === pkg.id
                            ? 'bg-primary/20 border border-primary text-foreground'
                            : 'glass-card text-foreground hover:border-primary/20'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {pkg.name}
                          {pkg.popular && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-bold uppercase">
                              Popular
                            </span>
                          )}
                        </span>
                        <span className="font-display font-bold text-primary">{pkg.price} EGP</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                disabled={!selectedPkg}
                onClick={() => setStep(3)}
                className="w-full py-2.5 rounded-md font-display font-semibold text-sm bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next: Payment <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 block">
                  Payment Method
                </label>
                <div className="flex gap-2">
                  {(['vodafone', 'instapay'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setPaymentMethod(m); setAssignedAdmin(null); }}
                      className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                        paymentMethod === m
                          ? 'bg-primary text-primary-foreground glow-cyan'
                          : 'glass-card text-foreground'
                      }`}
                    >
                      {m === 'vodafone' ? 'Vodafone Cash' : 'InstaPay'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Store open/closed status pill */}
              <div
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-display font-semibold ${
                  storeStatus?.is_open
                    ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                    : 'bg-destructive/15 text-destructive border border-destructive/30'
                }`}
              >
                {storeStatus?.is_open
                  ? `🟢 Store Open${storeStatus.admin_name ? ` — Transfer to ${storeStatus.admin_name}` : ''}`
                  : '🔴 Store Closed — We\'ll be back soon'}
              </div>

              {!storeStatus?.is_open && (
                <p className="text-xs text-center text-muted-foreground">
                  Store is currently offline, please check back later
                </p>
              )}

              {paymentMethod && !assignedAdmin && (
                <button
                  onClick={handleRequestAdmin}
                  disabled={loadingAdmin || !storeStatus?.is_open}
                  className="w-full py-2.5 rounded-md font-display font-semibold text-sm bg-secondary text-secondary-foreground flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingAdmin ? <><Loader2 size={16} className="animate-spin" /> Finding admin...</> : 'Request Transfer Number'}
                </button>
              )}

              {assignedAdmin && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Available Admin</p>
                  <p className="font-display font-bold text-foreground">{assignedAdmin.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-primary font-mono text-sm">{assignedAdmin.transferNumber}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(assignedAdmin.transferNumber);
                        toast({ title: 'Copied!' });
                      }}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {assignedAdmin && (
                <div>
                  <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 block">
                    Upload Receipt
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 rounded-md border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center gap-2 text-muted-foreground"
                  >
                    {receiptFile ? (
                      <><Check size={20} className="text-primary" /><span className="text-xs text-foreground">{receiptFile.name}</span></>
                    ) : (
                      <><Upload size={20} /><span className="text-xs">Tap to upload screenshot</span></>
                    )}
                  </button>
                </div>
              )}

              {assignedAdmin && receiptFile && (
                <div className="glass-card p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="text-foreground">{selectedPkg?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="text-primary font-bold">{selectedPkg?.price} EGP</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Server</span><span className="text-foreground">{server}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">UID</span><span className="text-foreground">{uid}</span></div>
                </div>
              )}

              <button
                disabled={!assignedAdmin || !receiptFile || submitting}
                onClick={handleSubmitOrder}
                className="w-full py-2.5 rounded-md font-display font-bold text-sm gradient-cyan-purple text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Order'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CheckoutFlow;
