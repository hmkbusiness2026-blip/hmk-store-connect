import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save, Trash2, ImageIcon } from 'lucide-react';
import { mlbbPackages, type PackageItem } from '@/lib/gameData';

interface Override {
  display_name: string;
  price: string;
  image_url: string;
  dirty?: boolean;
  deleteImage?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  gameId: string;
  onSavedAll?: (
    overrides: Record<string, { display_name?: string | null; price?: number | null; image_url?: string }>
  ) => void;
}

const ProductsManagerDialog = ({ open, onClose, gameId, onSavedAll }: Props) => {
  const { toast } = useToast();
  const packages = useMemo<PackageItem[]>(() => mlbbPackages.flatMap((c) => c.packages), []);
  const [rows, setRows] = useState<Record<string, Override>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('product_images')
        .select('package_id, image_url, display_name, price')
        .eq('game_id', gameId);
      const map: Record<string, Override> = {};
      packages.forEach((p) => {
        const existing = (data || []).find((r: any) => r.package_id === p.id);
        map[p.id] = {
          display_name: existing?.display_name ?? p.name,
          price: String(existing?.price ?? p.price),
          image_url: existing?.image_url ?? '',
        };
      });
      setRows(map);
      setLoading(false);
    })();
  }, [open, gameId, packages]);

  const update = (id: string, patch: Partial<Override>) => {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch, dirty: true } }));
  };

  const handleUpload = async (id: string, file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `products/${gameId}/${id}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      update(id, { image_url: `${data.publicUrl}?t=${Date.now()}`, deleteImage: false });
    } catch (e: any) {
      toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dirty = Object.entries(rows).filter(([, v]) => v.dirty);
      const payload = dirty.map(([package_id, v]) => ({
        game_id: gameId,
        package_id,
        display_name: v.display_name?.trim() || null,
        price: v.price ? Number(v.price) : null,
        image_url: v.deleteImage ? '' : (v.image_url || ''),
        updated_at: new Date().toISOString(),
      }));
      if (payload.length) {
        const { error } = await (supabase as any)
          .from('product_images')
          .upsert(payload, { onConflict: 'game_id,package_id' });
        if (error) throw error;
      }
      const summary: Record<string, any> = {};
      payload.forEach((p) => {
        summary[p.package_id] = {
          display_name: p.display_name,
          price: p.price,
          image_url: p.image_url,
        };
      });
      onSavedAll?.(summary);
      toast({ title: 'تم حفظ التعديلات' });
      onClose();
    } catch (e: any) {
      toast({ title: 'فشل الحفظ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display gradient-text">إدارة المنتجات</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 grid place-items-center py-12">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {packages.map((p) => {
              const r = rows[p.id];
              if (!r) return null;
              const showImg = !r.deleteImage && r.image_url;
              return (
                <div
                  key={p.id}
                  className="glass-card rounded-xl p-3 flex items-center gap-3 border border-border"
                >
                  <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted grid place-items-center relative">
                    {showImg ? (
                      <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground">الاسم</label>
                      <input
                        value={r.display_name}
                        onChange={(e) => update(p.id, { display_name: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-md bg-muted border border-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">السعر (EGP)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={r.price}
                        onChange={(e) =>
                          update(p.id, { price: e.target.value.replace(/[^\d.]/g, '') })
                        }
                        className="w-full px-2 py-1.5 rounded-md bg-muted border border-border text-xs"
                      />
                    </div>
                    <div className="flex items-end gap-1">
                      <label className="flex-1 cursor-pointer px-2 py-1.5 rounded-md border border-dashed border-border hover:border-primary/40 text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                        <Upload size={11} /> صورة
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files?.[0] && handleUpload(p.id, e.target.files[0])
                          }
                        />
                      </label>
                      {showImg && (
                        <button
                          type="button"
                          onClick={() => update(p.id, { deleteImage: true, image_url: '' })}
                          className="px-2 py-1.5 rounded-md bg-destructive/10 text-destructive border border-destructive/30"
                          aria-label="حذف الصورة"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="mt-3 w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          حفظ التعديلات
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ProductsManagerDialog;
