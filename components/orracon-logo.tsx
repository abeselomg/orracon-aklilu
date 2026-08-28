export function OrraconLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Orracon"
    >
      <circle cx="48" cy="48" r="46" fill="#141414" />
      <circle cx="48" cy="48" r="41" fill="none" stroke="#c9a227" strokeWidth="2.2" />
      <text
        x="48"
        y="58"
        textAnchor="middle"
        fill="#e4c45a"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="44"
        fontWeight="700"
      >
        R
      </text>
      <text
        x="48"
        y="78"
        textAnchor="middle"
        fill="#f3e6c0"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        letterSpacing="1.6"
      >
        ORRACON
      </text>
    </svg>
  );
}
