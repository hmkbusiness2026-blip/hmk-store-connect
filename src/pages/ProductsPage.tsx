import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, Plus, Gem, LogIn, Clock } from 'lucide-react';
import { games, arabicServers, mlbbPackages, type PackageItem } from '@/lib/gameData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreOnDuty } from '@/hooks/useStoreOnDuty';

interface CartItem extends PackageItem {
  qty: number;
}

const ProductsPage = () => {
  const { gameId, serverId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { onDuty } = useStoreOnDuty();
  const game = games.find((g) => g.id === gameId);
  const server = arabicServers.find((s) => s.id === serverId);

  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [playerId, setPlayerId] = useState('');
  const [serverNum, setServerNum] = useState('');

  const allPackages = useMemo(() => mlbbPackages.flatMap((c) => c.packages), []);

  const totalPrice = useMemo(
    () => Object.values(cart).reduce((sum, i) => sum + i.price * i.qty, 0),
    [cart]
  );
  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, i) => sum + i.qty, 0),
    [cart]
  );

  const toggle = (pkg: PackageItem) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[pkg.id]) delete next[pkg.id];
      else next[pkg.id] = { ...pkg, qty: 1 };
      return next;
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return prev;
      const newQty = next[id].qty + delta;
      if (newQty <= 0) delete next[id];
      else next[id] = { ...next[id], qty: newQty };
      return next;
    });
  };

  const canCheckout = totalItems > 0 && playerId.trim().length > 0 && serverNum.trim().length > 0 && onDuty === true;

  const handleCheckout = () => {
    if (!canCheckout || !game || !server) return;
    navigate('/checkout', {
      state: {
        gameId: game.id,
        gameName: lang === 'ar' ? game.nameAr : game.name,
        serverId: server.id,
        serverLabel: lang === 'ar' ? server.labelAr : server.labelEn,
        playerId,
        serverNum,
        items: Object.values(cart),
        total: totalPrice,
      },
    });
  };

  if (!game || !server) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen pb-36">
      <header className="sticky top-0 z-30 glass border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full glass-card text-foreground hover:text-primary transition-colors"
            aria-label="Back"
          >
            <BackIcon size={18} />
          </button>
          <h1 className="font-display font-extrabold text-base text-foreground truncate">
            {lang === 'ar' ? game.nameAr : game.name} · {lang === 'ar' ? server.labelAr : server.labelEn}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-5 pt-4 space-y-6 max-w-lg mx-auto">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl">
          <img src={game.image} alt={game.name} className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          <div className="absolute bottom-3 start-4 end-4">
            <p className="text-[10px] font-display text-primary uppercase tracking-widest">
              {lang === 'ar' ? 'باقات الشحن' : 'Top-up Packages'}
            </p>
            <h2 className="text-lg font-display font-extrabold text-foreground">
              {lang === 'ar' ? game.nameAr : game.name}
            </h2>
          </div>
        </div>

        {/* Products grid */}
        <div>
          <h3 className="font-display font-bold text-sm text-foreground mb-3">
            {lang === 'ar' ? 'اختر الباقات' : 'Choose Packages'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allPackages.map((pkg) => {
              const inCart = cart[pkg.id];
              return (
                <button
                  key={pkg.id}
                  onClick={() => toggle(pkg)}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                    inCart
                      ? 'border-primary bg-primary/10 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]'
                      : 'border-border glass-card hover:border-primary/40'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute top-1.5 start-1.5 text-[9px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-bold uppercase">
                      ★
                    </span>
                  )}
                  <Gem size={22} className="text-primary mb-1" />
                  <span className="font-display font-bold text-sm text-foreground">
                    {pkg.diamonds ?? pkg.name}
                  </span>
                  <span className="w-full text-start text-xs font-display font-bold text-primary mt-1">
                    {pkg.price} EGP
                  </span>

                  {inCart && (
                    <div
                      className="mt-2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-full px-2 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => updateQty(pkg.id, -1)}
                        className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
                        aria-label="Decrease"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold text-foreground min-w-[14px] text-center">
                        {inCart.qty}
                      </span>
                      <button
                        onClick={() => updateQty(pkg.id, 1)}
                        className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                        aria-label="Increase"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {onDuty === false && (
          <div className="glass-card p-4 rounded-2xl border border-destructive/40 flex items-start gap-3">
            <Clock className="text-destructive shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <p className="font-display font-extrabold text-sm text-destructive">
                {lang === 'ar' ? 'نحن خارج أوقات العمل حالياً' : 'We are currently off-duty'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'مواعيد العمل: 10 صباحاً - 2 منتصف الليل' : 'Working hours: 10 AM – 2 AM'}
              </p>
            </div>
          </div>
        )}

        {user ? (
          <>
            {/* Player info form */}
            <div className="glass-card p-4 rounded-2xl space-y-3">
              <div>
                <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  {lang === 'ar' ? 'الايدي' : 'Player ID'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456780"
                  value={playerId}
                  disabled={onDuty === false}
                  onChange={(e) => setPlayerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  {lang === 'ar' ? 'السيرفر' : 'Server'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234"
                  value={serverNum}
                  disabled={onDuty === false}
                  onChange={(e) => setServerNum(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {onDuty !== false && (
              <button
                disabled={!canCheckout}
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-2xl font-display font-extrabold text-base bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                {lang === 'ar' ? 'متابعة' : 'Continue'}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-extrabold text-base bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] active:scale-[0.98] transition-transform"
          >
            <LogIn size={18} />
            {lang === 'ar' ? 'تسجيل الدخول لإكمال الدفع' : 'Login to proceed to payment'}
          </button>
        )}
      </div>

      {/* Sticky bottom total (hidden when off-duty) */}
      {totalItems > 0 && onDuty !== false && (
        <div className="fixed bottom-0 inset-x-0 z-30 glass border-t border-border/60 px-5 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="text-end">
              <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                {lang === 'ar' ? 'الإجمالي' : 'Total'}
              </p>
              <p className="font-display font-extrabold text-lg text-primary">{totalPrice} EGP</p>
            </div>
            {user ? (
              <button
                disabled={!canCheckout}
                onClick={handleCheckout}
                className="flex-1 py-3 rounded-full font-display font-extrabold text-sm bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                {lang === 'ar' ? 'الاكمال للدفع' : 'Proceed to Payment'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex-1 py-3 rounded-full font-display font-extrabold text-sm bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] active:scale-[0.98] transition-transform"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
