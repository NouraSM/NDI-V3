export function Donut({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
  const cx = 80,
    cy = 80,
    r = 60,
    strokeW = 22;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <>
      <svg viewBox="0 0 160 160" className="donut-svg">
        {data.map((d) => {
          const pct = total > 0 ? d.value / total : 0;
          const dashLen = pct * circumference;
          const el = (
            <circle
              key={d.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dashLen;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--navy)">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="var(--text-light)">
          Total
        </text>
      </svg>
      <div className="donut-legend">
        {data.map((d) => (
          <div className="donut-legend-item" key={d.label}>
            <div className="donut-legend-dot" style={{ background: d.color }} />
            {d.label}
            <span className="donut-legend-value">{d.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
