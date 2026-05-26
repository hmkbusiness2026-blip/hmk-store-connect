import { Pencil } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

interface Props {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  label?: string;
}

/**
 * Floating pencil button that only renders for users with the `owner` role.
 * Wrap it inside a `relative` parent and the button positions itself in the
 * top-end corner. Stops click propagation so it never triggers the underlying
 * card action.
 */
const OwnerEditButton = ({ onClick, className, label = 'تعديل' }: Props) => {
  const { isOwner } = usePermissions();
  if (!isOwner) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick(e);
      }}
      aria-label={label}
      className={cn(
        'absolute top-1.5 end-1.5 z-30 w-7 h-7 rounded-full grid place-items-center',
        'bg-primary text-primary-foreground border border-primary/40',
        'shadow-[0_0_14px_hsl(var(--primary)/0.55)] hover:brightness-110 active:scale-95 transition',
        className,
      )}
    >
      <Pencil size={13} strokeWidth={2.4} />
    </button>
  );
};

export default OwnerEditButton;
