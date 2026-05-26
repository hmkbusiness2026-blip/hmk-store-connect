import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  gameId: string;
  packageId: string;
  defaultName: string;
  defaultPrice: number;
  currentImage?: string;
  onSaved?: (next: { display_name?: string; price?: number; image_url?: string }) => void;
}

const ProductEditDialog = ({
  open, onClose, gameId, packageId, defaultName, defaultPrice, currentImage, onSaved,
}: Props) => {
  const { toast } = useToast();
  const [name, setName] = useState(defaultName);
  const [price, setPrice] = useState<string>(String(defaultPrice));
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setPrice(String(defaultPrice));
      setImageUrl(currentImage || '');
    }
  }, [open, defaultName, defaultPrice, currentImage]);

  const uploadFile = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `products/${gameId}/${packageId}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleFile = async (file: File) => {
    try {
      setSaving(true);
      const url = await uploadFile(file);
      setImageUrl(url);
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
      const payload: any = {
        game_id: gameId,
        package_id: packageId,
        display_name: name.trim() || null,
        price: price ? Number(price) : null,
        image_url: imageUrl || '',
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from('product_images')
        .upsert(payload, { onConflict: 'game_id,package_id' });
      if (error) throw error;
      toast({ title: 'تم الحفظ' });
      onSaved?.({ display_name: payload.display_name, price: payload.price, image_url: payload.image_url });
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
          <DialogTitle className="font-display gradient-text">تعديل المنتج</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {imageUrl && <img src={imageUrl} alt="" className="w-full h-32 object-cover rounded-lg" />}
          <label className="w-full py-3 rounded-md border-2 border-dashed border-border hover:border-primary/40 transition-colors flex items-center justify-center gap-2 text-muted-foreground text-sm cursor-pointer">
            <Upload size={16} /> رفع صورة جديدة
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
          <div>
            <label className="text-xs text-muted-foreground">اسم المنتج</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">السعر (EGP)</label>
            <input type="number" inputMode="numeric" value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-sm" />
          </div>
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

export default ProductEditDialog;
