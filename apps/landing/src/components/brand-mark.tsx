interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 22 }: BrandMarkProps) {
  return (
    <div className="brand">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="var(--accent)" />
        <path
          d="M5 16.5 L9 8 L12 13.5 L15 8 L19 16.5"
          stroke="var(--accent-on)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="12" cy="12" r="11" stroke="var(--ink)" strokeOpacity="0.08" />
      </svg>
      <span style={{ fontSize: `${size * 1.1}px` }}>Motive</span>
    </div>
  );
}
