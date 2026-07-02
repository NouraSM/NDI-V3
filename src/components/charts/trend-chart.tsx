import type { TrendPoint } from "@/types/api";

export function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const w = 700,
    h = 200,
    pad = 40;
  const maxV = Math.max(...trend.flatMap((t) => [t.complete, t.partial, t.incomplete]), 1);
  const xStep = trend.length > 1 ? (w - pad * 2) / (trend.length - 1) : 0;

  const line = (key: keyof TrendPoint, color: string) => {
    const points = trend
      .map((d, i) => {
        const x = pad + i * xStep;
        const y = h - pad - ((d[key] as number) / maxV) * (h - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
    return <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
  };

  const dots = (key: keyof TrendPoint, color: string) =>
    trend.map((d, i) => {
      const x = pad + i * xStep;
      const y = h - pad - ((d[key] as number) / maxV) * (h - pad * 2);
      return <circle key={i} cx={x} cy={y} r={4} fill={color} stroke="white" strokeWidth={2} />;
    });

  const gridlines = Array.from({ length: 5 }, (_, i) => {
    const y = pad + i * ((h - pad * 2) / 4);
    const val = Math.round(maxV - i * (maxV / 4));
    return (
      <g key={i}>
        <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#eee" strokeWidth={1} />
        <text x={pad - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#aaa">
          {val}
        </text>
      </g>
    );
  });

  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} className="line-chart-svg">
        {gridlines}
        {line("complete", "#00c9b7")}
        {line("partial", "#f5a623")}
        {line("incomplete", "#ef335e")}
        {dots("complete", "#00c9b7")}
        {dots("partial", "#f5a623")}
        {dots("incomplete", "#ef335e")}
        {trend.map((d, i) => (
          <text key={i} x={pad + i * xStep} y={h - 10} textAnchor="middle" fontSize={10} fill="#6e6e8a">
            {d.period}
          </text>
        ))}
      </svg>
      <div className="chart-legend" style={{ marginTop: 10 }}>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "var(--teal)" }} />
          Complete
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "var(--amber)" }} />
          Partial
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "var(--pink)" }} />
          Incomplete
        </div>
      </div>
    </>
  );
}
