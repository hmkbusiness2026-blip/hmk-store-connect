const ProWatermark = ({ text }: { text: string }) => {
  const label = text || 'HMK STORE';
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden opacity-[0.06] select-none">
      <div className="absolute inset-0 flex flex-wrap gap-14 -rotate-45 scale-150 origin-center">
        {Array.from({ length: 120 }).map((_, i) => (
          <span key={i} className="text-foreground font-mono text-xs whitespace-nowrap">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};
export default ProWatermark;
