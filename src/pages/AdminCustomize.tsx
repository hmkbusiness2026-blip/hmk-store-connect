import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, Loader2, Home as HomeIcon, Gamepad2, Pencil, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { games } from '@/lib/gameData';
import BannersManagerDialog from '@/components/owner/BannersManagerDialog';
import ProductsManagerDialog from '@/components/owner/ProductsManagerDialog';
import FavoriteIconEditDialog from '@/components/owner/FavoriteIconEditDialog';

type TabKey = 'home' | 'hok' | 'mlbb';

const SLIDE_KEYS = ['banner_main', 'banner_2', 'banner_3', 'banner_4'];

const AdminCustomize = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthorized = userRole === 'admin' || userRole === 'owner';

  const [tab, setTab] = useState<TabKey>('home');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [bannersOpen, setBannersOpen] = useState(false);
  const [gameBannersOpen, setGameBannersOpen] = useState<null | 'hok' | 'mlbb'>(null);
  const [favOpen, setFavOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState<null | string>(null);

  useEffect(() => {
    if (!isAuthorized) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('site_config').select('key, value');
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { if (r.value) map[r.key] = r.value; });
      setConfig(map);
      setLoading(false);
    })();
  }, [isAuthorized]);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fullPath = `${path}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(fullPath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('site-assets').getPublicUrl(fullPath);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const upsert = async (key: string, value: string) => {
    const { error } = await supabase.from('site_config').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    setConfig((p) => ({ ...p, [key]: value }));
  };

  const handleGameUpload = async (gameId: string, file: File) => {
    try {
      const url = await uploadFile(file, `games/${gameId}`);
      await upsert(`game_img_${gameId}`, url);
      toast({ title: 'تم تحديث صورة اللعبة' });
    } catch (e: any) {
      toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' });
    }
  };

  const currentBannerImages = useMemo(() => {
    const m: Record<string, string> = {};
    SLIDE_KEYS.forEach((k) => { m[k] = config[k] || ''; });
    return m;
  }, [config]);

  const currentBannerTitles = useMemo(() => {
    const m: Record<string, string> = {};
    SLIDE_KEYS.forEach((k) => { m[k] = config[`${k}_title`] || ''; });
    return m;
  }, [config]);

  const currentBannerSubtitles = useMemo(() => {
    const m: Record<string, string> = {};
    SLIDE_KEYS.forEach((k) => { m[k] = config[`${k}_subtitle`] || ''; });
    return m;
  }, [config]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-20">
        <div className="glass-card p-6 text-center">
          <h1 className="font-display font-bold text-lg text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground mt-2">Owner/Admin access required</p>
        </div>
      </div>
    );
  }

  const NavItem = ({ value, icon: Icon, label }: { value: TabKey; icon: any; label: string }) => (
    <button
      onClick={() => setTab(value)}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-display font-bold transition ${
        tab === value
          ? 'bg-primary/15 text-primary border border-primary/40 shadow-[0_0_14px_hsl(var(--primary)/0.25)]'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
      }`}
    >
      <Icon size={16} />
      <span className="flex-1 text-right">{label}</span>
    </button>
  );

  return (
    <div dir="rtl" className="min-h-screen pb-24 px-3 pt-4 bg-[#0B0F19]">
      <header className="max-w-5xl mx-auto flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowRight size={20} />
        </button>
        <h1 className="font-display font-extrabold text-xl gradient-text">تخصيص الموقع</h1>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-12 gap-3">
        {/* Sidebar (right in RTL = first column) */}
        <aside className="col-span-4 sm:col-span-3">
          <div className="glass-card p-2 space-y-1 sticky top-4">
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground font-display">
              الصفحات
            </p>
            <NavItem value="home" icon={HomeIcon} label="الصفحة الرئيسية" />
            <NavItem value="hok" icon={Gamepad2} label="هونر أوف كينجز" />
            <NavItem value="mlbb" icon={Gamepad2} label="موبايل ليجندز" />
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-8 sm:col-span-9 space-y-4">
          {loading ? (
            <div className="glass-card p-12 grid place-items-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : tab === 'home' ? (
            <>
              {/* Banner slides */}
              <section className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-foreground">شرائح البانر</h2>
                  <button
                    onClick={() => setBannersOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-display font-bold shadow-[0_0_14px_hsl(var(--primary)/0.45)] hover:brightness-110 active:scale-95 transition"
                  >
                    <Pencil size={12} /> تعديل البانرات
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SLIDE_KEYS.map((k, i) => (
                    <div key={k} className="aspect-video rounded-lg overflow-hidden bg-muted grid place-items-center border border-border">
                      {config[k] ? (
                        <img src={config[k]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <ImageIcon size={18} />
                          <span className="text-[10px]">شريحة {i + 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Main game cards */}
              <section className="glass-card p-4 space-y-3">
                <h2 className="font-display font-bold text-sm text-foreground">صور ألعاب الرئيسية</h2>
                <div className="grid grid-cols-2 gap-3">
                  {games.map((g) => {
                    const current = config[`game_img_${g.id}`] || g.image;
                    return (
                      <div key={g.id} className="relative rounded-xl overflow-hidden border border-border group">
                        <img src={current} alt={g.nameAr} className="w-full h-32 object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2">
                          <p className="font-display font-bold text-xs text-foreground">{g.nameAr}</p>
                        </div>
                        <label className="absolute top-2 end-2 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-display font-bold shadow-[0_0_10px_hsl(var(--primary)/0.5)] hover:brightness-110">
                          <Pencil size={10} /> تعديل
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleGameUpload(g.id, e.target.files[0])}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Favorite game icon */}
              <section className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-foreground">زر اللعبة المفضلة</h2>
                  <button
                    onClick={() => setFavOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-display font-bold shadow-[0_0_14px_hsl(var(--primary)/0.45)] hover:brightness-110 active:scale-95 transition"
                  >
                    <Pencil size={12} /> تعديل الأيقونة
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  استبدال الأيقونة الظاهرة في الزر العائم بأسفل الشاشة.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-foreground">
                    بانرات {tab === 'hok' ? 'هونر أوف كينجز' : 'موبايل ليجندز'}
                  </h2>
                  <button
                    onClick={() => setGameBannersOpen(tab as 'hok' | 'mlbb')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-display font-bold shadow-[0_0_14px_hsl(var(--primary)/0.45)] hover:brightness-110 active:scale-95 transition"
                  >
                    <Pencil size={12} /> تعديل البانرات
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['1', '2', '3', '4'].map((id) => {
                    const k = `${tab}_banner_${id}`;
                    return (
                      <div key={id} className="aspect-video rounded-lg overflow-hidden bg-muted grid place-items-center border border-border">
                        {config[k] ? (
                          <img src={config[k]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <ImageIcon size={18} />
                            <span className="text-[10px]">شريحة {id}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  بانرات خاصة بهذه اللعبة فقط، ولا تظهر في الصفحة الرئيسية.
                </p>
              </section>

              <section className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-foreground">
                    منتجات {tab === 'hok' ? 'هونر أوف كينجز' : 'موبايل ليجندز'}
                  </h2>
                  <button
                    onClick={() => setProductsOpen(tab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-display font-bold shadow-[0_0_14px_hsl(var(--primary)/0.45)] hover:brightness-110 active:scale-95 transition"
                  >
                    <Pencil size={12} /> تعديل المنتجات
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  إدارة الباقات: تعديل صورة المنتج، الاسم/الكمية، والسعر. تنعكس التعديلات على واجهة المتجر فوراً مع الحفاظ على محاذاة السعر إلى اليسار.
                </p>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <BannersManagerDialog
        open={bannersOpen}
        onClose={() => setBannersOpen(false)}
        slideKeys={SLIDE_KEYS}
        currentImages={currentBannerImages}
        currentTitles={currentBannerTitles}
        currentSubtitles={currentBannerSubtitles}
        onSavedAll={({ images, titles, subtitles }) => {
          setConfig((p) => {
            const next = { ...p };
            Object.entries(images).forEach(([k, v]) => { next[k] = v; });
            Object.entries(titles).forEach(([k, v]) => { next[`${k}_title`] = v; });
            Object.entries(subtitles).forEach(([k, v]) => { next[`${k}_subtitle`] = v; });
            return next;
          });
        }}
      />
      <FavoriteIconEditDialog
        open={favOpen}
        onClose={() => setFavOpen(false)}
        gameId="default"
        currentImage={config['fav_icon_default']}
        onSaved={(url) => setConfig((p) => ({ ...p, fav_icon_default: url }))}
      />
      {productsOpen && (
        <ProductsManagerDialog
          open={!!productsOpen}
          onClose={() => setProductsOpen(null)}
          gameId={productsOpen}
        />
      )}

      {gameBannersOpen && (() => {
        const scope = gameBannersOpen;
        const ids = ['1', '2', '3', '4'];
        const imgs: Record<string, string> = {};
        const ttls: Record<string, string> = {};
        const subs: Record<string, string> = {};
        ids.forEach((id) => {
          const base = `${scope}_banner_${id}`;
          imgs[id] = config[base] || '';
          ttls[id] = config[`${base}_title`] || '';
          subs[id] = config[`${base}_subtitle`] || '';
        });
        return (
          <BannersManagerDialog
            open={!!gameBannersOpen}
            onClose={() => setGameBannersOpen(null)}
            slideKeys={ids}
            keyForRow={(id, suffix) => {
              const base = `${scope}_banner_${id}`;
              return suffix ? `${base}_${suffix}` : base;
            }}
            currentImages={imgs}
            currentTitles={ttls}
            currentSubtitles={subs}
            onSavedAll={({ images, titles, subtitles }) => {
              setConfig((p) => {
                const next = { ...p };
                Object.entries(images).forEach(([id, v]) => { next[`${scope}_banner_${id}`] = v; });
                Object.entries(titles).forEach(([id, v]) => { next[`${scope}_banner_${id}_title`] = v; });
                Object.entries(subtitles).forEach(([id, v]) => { next[`${scope}_banner_${id}_subtitle`] = v; });
                return next;
              });
            }}
          />
        );
      })()}
    </div>
  );
};

export default AdminCustomize;
