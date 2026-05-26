import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save, Trash2, ImageIcon } from 'lucide-react';

interface SlideRow {
  key: string;
  label: string;
  url: string;
  title: string;
  subtitle: string;
  dirty?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  slideKeys: string[];
  /** Maps a row key (+ optional suffix) to the actual site_config key. Defaults to identity. */
  keyForRow?: (rowKey: string, suffix?: 'title' | 'subtitle') => string;
  currentImages: Record<string, string>;
  currentTitles?: Record<string, string>;
  currentSubtitles?: Record<string, string>;
  onSavedAll?: (next: {
    images: Record<string, string>;
    titles: Record<string, string>;
    subtitles: Record<string, string>;
  }) => void;
}

const BannersManagerDialog = ({
  open,
  onClose,
  slideKeys,
  keyForRow,
  currentImages,
  currentTitles = {},
  currentSubtitles = {},
  onSavedAll,
}: Props) => {
  const { toast } = useToast();
  const resolveKey = (rowKey: string, suffix?: 'title' | 'subtitle') =>
    keyForRow ? keyForRow(rowKey, suffix) : suffix ? `${rowKey}_${suffix}` : rowKey;
  const [rows, setRows] = useState<SlideRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows(
      slideKeys.map((k, i) => ({
        key: k,
        label: `الشريحة ${i + 1}`,
        url: currentImages[k] || '',
        title: currentTitles[k] || '',
        subtitle: currentSubtitles[k] || '',
      })),
    );
  }, [open, slideKeys, currentImages, currentTitles, currentSubtitles]);

  const update = (key: string, patch: Partial<SlideRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, dirty: true } : r)));

  const handleUpload = async (key: string, file: File) => {
    try {
      // Banners that are tens of megabytes appear as a "black slide" because
      // the browser is still downloading them. Downscale anything > 1MB to a
      // reasonable 1600px-wide JPEG before upload.
      let toUpload: Blob = file;
      let ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      if (file.size > 1024 * 1024) {
        try {
          const bitmap = await createImageBitmap(file);
          const maxW = 1600;
          const scale = Math.min(1, maxW / bitmap.width);
          const w = Math.round(bitmap.width * scale);
          const h = Math.round(bitmap.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(bitmap, 0, 0, w, h);
          const blob: Blob = await new Promise((res) =>
            canvas.toBlob((b) => res(b!), 'image/jpeg', 0.85)!
          );
          toUpload = blob;
          ext = 'jpg';
          console.log(`[banners] resized ${key}: ${(file.size/1024/1024).toFixed(1)}MB -> ${(blob.size/1024).toFixed(0)}KB`);
        } catch (err) {
          console.warn('[banners] resize failed, uploading original', err);
        }
      }
      const path = `banners/${resolveKey(key)}.${ext}`;
      const { error } = await supabase.storage
        .from('site-assets')
        .upload(path, toUpload, { upsert: true, contentType: toUpload.type || `image/${ext}` });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`;
      console.log(`[banners] uploaded ${key} ->`, finalUrl);
      if (!finalUrl || !data.publicUrl) {
        throw new Error('Failed to resolve public URL');
      }
      update(key, { url: finalUrl });
    } catch (e: any) {
      console.error('[banners] upload error', e);
      toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist ALL rows (not only dirty) so every slide's image/title/subtitle
      // is guaranteed to land in site_config. This prevents "dummy save" where
      // only slide 1 was updated.
      const now = new Date().toISOString();
      const payload: { key: string; value: string; updated_at: string }[] = [];
      rows.forEach((r) => {
        payload.push({ key: resolveKey(r.key), value: r.url ?? '', updated_at: now });
        payload.push({ key: resolveKey(r.key, 'title'), value: r.title ?? '', updated_at: now });
        payload.push({ key: resolveKey(r.key, 'subtitle'), value: r.subtitle ?? '', updated_at: now });
      });
      const { error } = await supabase
        .from('site_config')
        .upsert(payload, { onConflict: 'key' });
      if (error) throw error;

      const images: Record<string, string> = {};
      const titles: Record<string, string> = {};
      const subtitles: Record<string, string> = {};
      rows.forEach((r) => {
        images[r.key] = r.url;
        titles[r.key] = r.title;
        subtitles[r.key] = r.subtitle;
      });
      onSavedAll?.({ images, titles, subtitles });
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
      <DialogContent dir="rtl" className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display gradient-text">إدارة البانرات</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {rows.map((r) => (
            <div key={r.key} className="glass-card rounded-xl p-3 space-y-2 border border-border">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs text-foreground">{r.label}</span>
                {(r.url || r.title || r.subtitle) && (
                  <button
                    type="button"
                    onClick={() => update(r.key, { url: '', title: '', subtitle: '' })}
                    className="text-destructive hover:opacity-80"
                    aria-label="حذف"
                    title="حذف الشريحة"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="w-full h-24 rounded-lg overflow-hidden bg-muted grid place-items-center relative">
                {r.url ? (
                  <>
                    <img src={r.url} alt="" className="w-full h-full object-cover" />
                    {(r.title || r.subtitle) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2">
                        <div className="text-white drop-shadow-md">
                          {r.title && <div className="text-[11px] font-display font-extrabold leading-tight">{r.title}</div>}
                          {r.subtitle && <div className="text-[9px] opacity-90 truncate">{r.subtitle}</div>}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <ImageIcon className="text-muted-foreground" />
                )}
              </div>

              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer px-2 py-2 rounded-md border-2 border-dashed border-border hover:border-primary/40 text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Upload size={12} /> رفع صورة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(r.key, e.target.files[0])}
                  />
                </label>
                <input
                  value={r.url}
                  onChange={(e) => update(r.key, { url: e.target.value })}
                  placeholder="أو الصق رابط"
                  className="flex-1 px-2 py-2 rounded-md bg-muted border border-border text-xs"
                />
              </div>

              <input
                value={r.title}
                onChange={(e) => update(r.key, { title: e.target.value })}
                placeholder="عنوان رئيسي"
                className="w-full px-2 py-2 rounded-md bg-muted border border-border text-xs font-display font-bold"
              />
              <input
                value={r.subtitle}
                onChange={(e) => update(r.key, { subtitle: e.target.value })}
                placeholder="نص فرعي"
                className="w-full px-2 py-2 rounded-md bg-muted border border-border text-xs"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          حفظ التعديلات
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default BannersManagerDialog;
