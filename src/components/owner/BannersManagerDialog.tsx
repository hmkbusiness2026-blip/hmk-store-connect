import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save, Trash2, ImageIcon } from 'lucide-react';

type Suffix = 'link' | 'btn_text';

interface SlideRow {
  key: string;
  label: string;
  url: string;
  link: string;
  btnText: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  slideKeys: string[];
  /** Maps a row key (+ optional suffix) to the actual site_config key. Defaults to identity. */
  keyForRow?: (rowKey: string, suffix?: Suffix) => string;
  currentImages: Record<string, string>;
  currentLinks?: Record<string, string>;
  currentBtnTexts?: Record<string, string>;
  defaultBtnText?: string;
  onSavedAll?: (next: {
    images: Record<string, string>;
    links: Record<string, string>;
    btnTexts: Record<string, string>;
  }) => void;
}

const BannersManagerDialog = ({
  open,
  onClose,
  slideKeys,
  keyForRow,
  currentImages,
  currentLinks = {},
  currentBtnTexts = {},
  defaultBtnText = 'اشحن الآن',
  onSavedAll,
}: Props) => {
  const { toast } = useToast();
  const resolveKey = (rowKey: string, suffix?: Suffix) =>
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
        link: currentLinks[k] || '',
        btnText: currentBtnTexts[k] || '',
      })),
    );
  }, [open, slideKeys, currentImages, currentLinks, currentBtnTexts]);

  const update = (key: string, patch: Partial<SlideRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleUpload = async (key: string, file: File) => {
    try {
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
      if (!finalUrl || !data.publicUrl) throw new Error('Failed to resolve public URL');
      update(key, { url: finalUrl });
    } catch (e: any) {
      console.error('[banners] upload error', e);
      toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload: { key: string; value: string; updated_at: string }[] = [];
      rows.forEach((r) => {
        payload.push({ key: resolveKey(r.key), value: r.url ?? '', updated_at: now });
        payload.push({ key: resolveKey(r.key, 'link'), value: r.link ?? '', updated_at: now });
        payload.push({
          key: resolveKey(r.key, 'btn_text'),
          value: (r.btnText ?? '').trim() || defaultBtnText,
          updated_at: now,
        });
      });
      const { error } = await supabase
        .from('site_config')
        .upsert(payload, { onConflict: 'key' });
      if (error) throw error;

      const images: Record<string, string> = {};
      const links: Record<string, string> = {};
      const btnTexts: Record<string, string> = {};
      rows.forEach((r) => {
        images[r.key] = r.url;
        links[r.key] = r.link;
        btnTexts[r.key] = r.btnText;
      });
      onSavedAll?.({ images, links, btnTexts });
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
                {(r.url || r.link || r.btnText) && (
                  <button
                    type="button"
                    onClick={() => update(r.key, { url: '', link: '', btnText: '' })}
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
                  <img src={r.url} alt="" className="w-full h-full object-cover" />
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
                  placeholder="أو الصق رابط الصورة"
                  className="flex-1 px-2 py-2 rounded-md bg-muted border border-border text-xs"
                />
              </div>

              <input
                value={r.link}
                onChange={(e) => update(r.key, { link: e.target.value })}
                placeholder="رابط الزر (مثال: /game/honor-of-kings)"
                dir="ltr"
                className="w-full px-2 py-2 rounded-md bg-muted border border-border text-xs"
              />
              <input
                value={r.btnText}
                onChange={(e) => update(r.key, { btnText: e.target.value })}
                placeholder={`نص الزر (افتراضي: ${defaultBtnText})`}
                className="w-full px-2 py-2 rounded-md bg-muted border border-border text-xs font-display font-bold"
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
