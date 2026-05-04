import { useAuth } from '@/contexts/AuthContext';

export type Role = 'client' | 'moderator' | 'admin' | 'owner';

export function usePermissions() {
  const { userRole } = useAuth();
  const role = (userRole ?? 'client') as Role;
  const isStaff = role === 'moderator' || role === 'admin' || role === 'owner';
  const isAdmin = role === 'admin' || role === 'owner';
  const isOwner = role === 'owner';
  const can = (need: Role | Role[]) => {
    const arr = Array.isArray(need) ? need : [need];
    return arr.includes(role);
  };
  return { role, isStaff, isAdmin, isOwner, can };
}

export function Can({ role, children }: { role: Role | Role[]; children: React.ReactNode }) {
  const { can } = usePermissions();
  if (!can(role)) return null;
  return <>{children}</>;
}
