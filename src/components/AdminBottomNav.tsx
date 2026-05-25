import { ClipboardList, Archive, User, Zap, SlidersHorizontal } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const items = [
  { to: '/admin/orders', label: 'الطلبات', icon: ClipboardList },
  { to: '/admin/control', label: 'التحكم', icon: SlidersHorizontal },
  { to: '/admin/archive', label: 'الأرشيف', icon: Archive },
  { to: '/admin/profile', label: 'البروفايل', icon: User },
];

const AdminBottomNav = () => {
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-lg mx-auto glass border-t border-border h-16 flex items-stretch">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-display font-semibold">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => navigate('/?adminTopup=1')}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <Zap size={20} />
          <span className="text-[10px] font-display font-semibold">الشحن</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminBottomNav;
