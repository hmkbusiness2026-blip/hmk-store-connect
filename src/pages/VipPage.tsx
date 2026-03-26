import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VipWatermark from '@/components/VipWatermark';
import { Crown, Shield } from 'lucide-react';

const VipPage = () => {
  const { phoneNumber } = useAuth();

  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    document.addEventListener('dragstart', handler);
    return () => {
      document.removeEventListener('contextmenu', handler);
      document.removeEventListener('dragstart', handler);
    };
  }, []);

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 no-select relative">
      <VipWatermark phone={phoneNumber || ''} />

      <div className="flex items-center gap-2 mb-4">
        <Crown size={20} className="text-accent" />
        <h1 className="font-display font-bold text-lg text-foreground">VIP Zone</h1>
      </div>

      <div className="glass-card p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Shield size={16} />
          <h2 className="font-display font-semibold text-sm">VIP Top-Up Guide</h2>
        </div>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
          <li>VIP members get priority order processing</li>
          <li>Exclusive discounts on bulk diamond purchases</li>
          <li>Direct admin contact for urgent top-ups</li>
          <li>Early access to seasonal promotions</li>
        </ul>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h2 className="font-display font-semibold text-sm text-foreground">VIP Pricing Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-display text-xs uppercase">Package</th>
                <th className="text-right py-2 text-muted-foreground font-display text-xs uppercase">Regular</th>
                <th className="text-right py-2 text-primary font-display text-xs uppercase">VIP Price</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {[
                ['86 Diamonds', '75', '70'],
                ['172 Diamonds', '140', '130'],
                ['600 Diamonds', '465', '440'],
                ['1412 Diamonds', '1050', '980'],
                ['Weekly Pass', '85', '78'],
              ].map(([pkg, reg, vip]) => (
                <tr key={pkg} className="border-b border-border/50">
                  <td className="py-2">{pkg}</td>
                  <td className="py-2 text-right text-muted-foreground">{reg} EGP</td>
                  <td className="py-2 text-right text-primary font-bold">{vip} EGP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VipPage;
