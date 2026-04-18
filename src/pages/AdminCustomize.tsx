import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { games } from '@/lib/gameData';

const AdminCustomize = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [gameUrls, setGameUrls] = useState<Record<string, string>>({});
  const [savingText, setSavingText] = useState(false);

  const isAuthorized = userRole === 'admin' || userRole === 'owner';

  useEffect(() => {
    if (!isAuthorized) return;
    (async () => {
      const { data } = await supabase.from('site_config').select('key, value');
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.key] = r.value; });
      setBannerUrl(map['banner_main'] || '');
      setBannerTitle(map['banner_title'] || '');
      setBannerSubtitle(map['banner_subtitle'] || '');
      const g: Record<string, string> = {};
      games.forEach(game => {
        if (map[`game_img_${game.id}`]) g[game.id] = map[`game_img_${game.id}`];
      });
      setGameUrls(g);
    })();
  }, [isAuthorized]);

  const upsertConfig = async (key: string, value: string) => {
    const { error } = await supabase.from('site_config').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fullPath = `${path}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(fullPath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('site-assets').getPublicUrl(fullPath);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleBannerUpload = async (file: File) => {
    try {
      const url = await uploadFile(file, 'banners/main');
      await upsertConfig('banner_main', url);
      setBannerUrl(url);
      toast({ title: 'Banner uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleGameUpload = async (gameId: string, file: File) => {
    try {
      const url = await uploadFile(file, `games/${gameId}`);
      await upsertConfig(`game_img_${gameId}`, url);
      setGameUrls(prev => ({ ...prev, [gameId]: url }));
      toast({ title: 'Game image updated' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  const saveTexts = async () => {
    setSavingText(true);
    try {
      await upsertConfig('banner_title', bannerTitle);
      await upsertConfig('banner_subtitle', bannerSubtitle);
      toast({ title: 'Banner text saved' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSavingText(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-20">
        <div className="glass-card p-6 text-center">
          <h1 className="font-display font-bold text-lg text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground mt-2">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4">
      <header className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-xl gradient-text">Site Customization</h1>
      </header>

      {/* Banner image */}
      <section className="glass-card p-4 space-y-3">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Promo Banner Image
        </h2>
        {bannerUrl && (
          <img src={bannerUrl} alt="Current banner" className="w-full h-32 object-cover rounded-md" />
        )}
        <label className="w-full py-3 rounded-md border-2 border-dashed border-border hover:border-primary/40 transition-colors flex items-center justify-center gap-2 text-muted-foreground text-sm cursor-pointer">
          <Upload size={16} />
          Upload new banner
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleBannerUpload(e.target.files[0])}
          />
        </label>
      </section>

      {/* Banner texts */}
      <section className="glass-card p-4 space-y-3">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Banner Text
        </h2>
        <input
          type="text"
          placeholder="Banner Title"
          value={bannerTitle}
          onChange={e => setBannerTitle(e.target.value)}
          className="w-full px-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Banner Subtitle"
          value={bannerSubtitle}
          onChange={e => setBannerSubtitle(e.target.value)}
          className="w-full px-3 py-2.5 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={saveTexts}
          disabled={savingText}
          className="w-full py-2.5 rounded-md font-display font-semibold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {savingText ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Text
        </button>
      </section>

      {/* Game images */}
      <section className="glass-card p-4 space-y-3">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Game Images
        </h2>
        <div className="space-y-3">
          {games.map(game => {
            const current = gameUrls[game.id] || game.image;
            return (
              <div key={game.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                <img src={current} alt={game.name} className="w-12 h-16 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm text-foreground truncate">{game.name}</p>
                  <label className="inline-flex items-center gap-1 mt-1 text-xs text-primary cursor-pointer hover:underline">
                    <Upload size={12} />
                    Replace image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleGameUpload(game.id, e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminCustomize;
