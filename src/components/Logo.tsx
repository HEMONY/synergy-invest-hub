import mark from "@/assets/synergy-mark.png";

export function Logo({ size = 40, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <img
        src={mark}
        alt="شعار Synergy"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain drop-shadow-sm"
      />
      {showWord && (
        <span className="brand-wordmark hidden text-sm text-foreground sm:inline">Synergy</span>
      )}
    </span>
  );
}
