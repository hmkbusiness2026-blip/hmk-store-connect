const VipWatermark = ({ phone }: { phone: string }) => {
  const text = phone || 'VIP';
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden opacity-5 no-select">
      <div className="absolute inset-0 flex flex-wrap gap-16 -rotate-45 scale-150 origin-center">
        {Array.from({ length: 80 }).map((_, i) => (
          <span key={i} className="text-foreground font-mono text-sm whitespace-nowrap">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default VipWatermark;
