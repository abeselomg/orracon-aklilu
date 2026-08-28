export function CraneWatermark() {
  return (
    <svg className="crane-watermark" viewBox="0 0 420 180" aria-hidden="true">
      <g fill="none" stroke="#7a8a4a" strokeWidth="1.4" opacity="0.35">
        <path d="M40 160 L40 40 L220 40 L220 160" />
        <path d="M40 70 L220 70 M40 100 L220 100 M40 130 L220 130" />
        <path d="M70 40 L70 160 M100 40 L100 160 M130 40 L130 160 M160 40 L160 160 M190 40 L190 160" />
        <path d="M220 55 L340 20 M340 20 L340 160 M300 32 L300 160" />
        <path d="M340 20 L390 70 L340 70" />
        <path d="M250 160 L390 160" />
        <circle cx="340" cy="20" r="4" fill="#7a8a4a" />
      </g>
    </svg>
  );
}
