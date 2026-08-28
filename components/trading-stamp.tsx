export function TradingStamp() {
  return (
    <div className="stamp" aria-label="Claimed — Orracon Trading Plc">
      <svg viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="74" fill="none" stroke="#1d4e89" strokeWidth="4" />
        <circle cx="80" cy="80" r="66" fill="none" stroke="#1d4e89" strokeWidth="1.5" />
        <circle cx="80" cy="80" r="36" fill="none" stroke="#1d4e89" strokeWidth="1.2" />
        <text
          x="80"
          y="84"
          textAnchor="middle"
          fill="#1d4e89"
          fontFamily="Georgia, serif"
          fontSize="11"
          fontWeight="700"
        >
          0911211588
        </text>
        <defs>
          <path id="stamp-ring" d="M80,80 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" />
        </defs>
        <text fill="#1d4e89" fontFamily="Georgia, serif" fontSize="11" fontWeight="700" letterSpacing="2.4">
          <textPath href="#stamp-ring" startOffset="50%" textAnchor="middle">
            ORRACON TRADING PLC
          </textPath>
        </text>
      </svg>
    </div>
  );
}
