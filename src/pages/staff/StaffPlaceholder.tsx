import { Construction } from 'lucide-react';

const StaffPlaceholder = ({ title }: { title: string }) => (
  <div className="p-6">
    <div className="glass-card p-8 text-center">
      <Construction size={36} className="mx-auto mb-3 text-muted-foreground" />
      <h1 className="font-display font-bold text-lg">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">Coming soon in the next staff portal iteration.</p>
    </div>
  </div>
);

export default StaffPlaceholder;
