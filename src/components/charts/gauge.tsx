export function Gauge({ pct, label }: { pct: number; label: string }) {
  const cx = 90,
    cy = 85,
    r = 70;
  const startAngle = Math.PI;
  const angle = (pct / 100) * 180;
  const endAngle = Math.PI + (angle / 180) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const bgX2 = cx + r * Math.cos(0);
  const bgY2 = cy + r * Math.sin(0);
  const largeArc = angle > 180 ? 1 : 0;
  const color = pct >= 60 ? "var(--teal)" : pct >= 40 ? "var(--amber)" : "var(--pink)";

  return (
    <div className="gauge-container">
      <svg viewBox="0 0 180 110" className="gauge-svg">
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`} fill="none" stroke="#eee" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
      <div className="gauge-value-text">{pct}%</div>
      <div className="gauge-label-text">{label}</div>
    </div>
  );
}
