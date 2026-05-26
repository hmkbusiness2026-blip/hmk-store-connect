import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  gameId: string;
  currentImage?: string;
  onSaved?: (url: string) => void;
}

const FavoriteIconEditDialog = ({ open, onClose, gameId, currentImage, onSaved }: Props) => {
  const { toast } = useToast();
  const [url, setUrl] = useState(currentImage || '');
  const [saving, setSaving] = useState(false);
  const key = `fav_icon_${gameId}`;

  useEffect(() => { if (open) setUrl(currentImage || ''); }, [open, currentImage]);

  const handleFile = async (file: File) => {
    setSaving(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `fav-icons/${gameId}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const pub = supabase.storage.from('site-assets').getPublicUrl(path);
      const next = `${pub.data.publicUrl}?t=${Date.now()}`;
      setUrl(next);
      toast({ title: 'تم رفع الصورة' });
    } catch (e: any) {
      toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('site_config')
        .upsert({ key, value: url, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast({ title: 'تم الحفظ' });
      onSaved?.(url);
      onClose();
    } catch (e: any) {
      toast({ title: 'فشل الحفظ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display gradient-text">تعديل أيقونة لعبتي</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {url && <img src={url} alt="" className="w-24 h-24 rounded-full object-cover mx-auto" />}
          <label className="w-full py-3 rounded-md border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center gap-2 text-muted-foreground text-sm cursor-pointer">
            <Upload size={16} /> رفع صورة
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            حفظ
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FavoriteIconEditDialog;
