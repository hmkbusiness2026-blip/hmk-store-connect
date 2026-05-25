import { Crown, BarChart3, ClipboardList, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/owner/leader', label: 'ليدر', icon: Crown },
  { to: '/owner/reports', label: 'تقارير', icon: BarChart3 },
  { to: '/owner/orders', label: 'طلبات', icon: ClipboardList },
  { to: '/owner/profile', label: 'البروفايل', icon: User },
];

const OwnerBottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-lg mx-auto glass border-t border-border h-16 flex items-stretch">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-primary text-glow-gold' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-display font-semibold">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default OwnerBottomNav;
