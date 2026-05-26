import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save, Trash2, ImageIcon } from 'lucide-react';

interface SlideRow {
  key: string;
  label: string;
  url: string;
  dirty?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  slideKeys: string[];               // e.g. ['banner_main','banner_2','banner_3']
  currentImages: Record<string, string>;
  onSavedAll?: (next: Record<string, string>) => void;
}

const BannersManagerDialog = ({ open, onClose, slideKeys, currentImages, onSavedAll }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<SlideRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows(
      slideKeys.map((k, i) => ({
        key: k,
        label: `الشريحة ${i + 1}`,
        url: currentImages[k] || '',
      })),
    );
  }, [open, slideKeys, currentImages]);

  const update = (key: string, patch: Partial<SlideRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, dirty: true } : r)));

  const handleUpload = async (key: string, file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `banners/${key}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      update(key, { url: `${data.publicUrl}?t=${Date.now()}` });
    } catch (e: any) {
      toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dirty = rows.filter((r) => r.dirty);
      if (dirty.length) {
        const { error } = await supabase
          .from('site_config')
          .upsert(
            dirty.map((r) => ({ key: r.key, value: r.url, updated_at: new Date().toISOString() })),
          );
        if (error) throw error;
      }
      const next: Record<string, string> = {};
      rows.forEach((r) => (next[r.key] = r.url));
      onSavedAll?.(next);
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

        <div className="flex-1 overflow-y-auto space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="glass-card rounded-xl p-3 space-y-2 border border-border">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs text-foreground">{r.label}</span>
                {r.url && (
                  <button
                    type="button"
                    onClick={() => update(r.key, { url: '' })}
                    className="text-destructive hover:opacity-80"
                    aria-label="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="w-full h-24 rounded-lg overflow-hidden bg-muted grid place-items-center">
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
                  placeholder="أو الصق رابط"
                  className="flex-1 px-2 py-2 rounded-md bg-muted border border-border text-xs"
                />
              </div>
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
