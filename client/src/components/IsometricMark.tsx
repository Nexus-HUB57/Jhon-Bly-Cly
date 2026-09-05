export function IsometricMark({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative grid h-9 w-9 place-items-center ${className}`}>
      <i className="absolute h-6 w-6 rotate-30 rounded-[6px] bg-cyan-400/80 shadow-[8px_8px_0_rgba(36,99,235,0.17)]" />
      <i className="absolute h-4 w-4 -translate-x-1 -translate-y-1 rotate-30 rounded-[4px] bg-[#ff7d6b] shadow-sm" />
      <i className="absolute h-2.5 w-2.5 translate-x-1 translate-y-1 rotate-30 rounded-[2px] bg-blue-600" />
    </div>
  );
}
