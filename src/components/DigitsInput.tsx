import { forwardRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { onlyDigits } from '@/lib/validation';
import { cn } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string;
  onChange: (v: string) => void;
};

const DigitsInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, className, ...rest }, ref) => {
    const { toast } = useToast();
    const [err, setErr] = useState(false);

    const flashError = () => {
      setErr(true);
      toast({ title: 'أرقام إنجليزية فقط (0-9)', variant: 'destructive' });
      setTimeout(() => setErr(false), 1200);
    };

    return (
      <input
        ref={ref}
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onKeyDown={(e) => {
          const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
          if (e.ctrlKey || e.metaKey) return;
          if (allowed.includes(e.key)) return;
          if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            flashError();
          }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          const cleaned = onlyDigits(text);
          if (cleaned !== text) {
            e.preventDefault();
            flashError();
            if (cleaned) onChange((value + cleaned).slice(0, (rest.maxLength as number) || 32));
          }
        }}
        onChange={(e) => {
          const cleaned = onlyDigits(e.target.value);
          if (cleaned !== e.target.value) flashError();
          onChange(cleaned);
        }}
        className={cn(
          'w-full px-3 py-2.5 rounded-md bg-muted border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
          err ? 'border-destructive ring-1 ring-destructive' : 'border-border',
          className
        )}
      />
    );
  }
);
DigitsInput.displayName = 'DigitsInput';

export default DigitsInput;
