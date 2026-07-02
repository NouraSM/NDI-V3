/** Single-series vertical bar chart (used for domain compliance %). */
export function SimpleBars({
  bars,
}: {
  bars: { label: string; value: number; color: string; valueLabel?: string }[];
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="bar-chart">
      {bars.map((b) => (
        <div className="bar-group" key={b.label}>
          <div className="bar-wrapper">
            <div className="bar" style={{ height: `${(b.value / max) * 180}px`, background: b.color }}>
              <div className="bar-value">{b.valueLabel ?? b.value}</div>
            </div>
          </div>
          <div className="bar-label">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Wider single-series bar chart used for maturity levels / severity / status counts. */
export function MaturityBars({
  bars,
}: {
  bars: { label: string; value: number; color: string; valueLabel?: string }[];
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="maturity-bars">
      {bars.map((b) => (
        <div className="maturity-col" key={b.label}>
          <div className="maturity-bar" style={{ height: `${(b.value / max) * 170}px`, background: b.color }}>
            <div className="maturity-pct">{b.valueLabel ?? b.value}</div>
          </div>
          <div className="maturity-level">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Multi-series grouped bar chart used for maturity-level breakdown by status. */
export function GroupedBars({
  groups,
  series,
}: {
  groups: { label: string; values: number[] }[];
  series: { label: string; color: string }[];
}) {
  const max = Math.max(...groups.flatMap((g) => g.values), 1);
  return (
    <>
      <div className="chart-legend">
        {series.map((s) => (
          <div className="legend-item" key={s.label}>
            <div className="legend-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
      <div className="grouped-bars">
        {groups.map((g) => (
          <div className="grouped-col" key={g.label}>
            <div className="grouped-bar-set">
              {g.values.map((v, i) => (
                <div key={i} className="g-bar" style={{ height: `${(v / max) * 170}px`, background: series[i]?.color }}>
                  <div className="bar-value">{v}</div>
                </div>
              ))}
            </div>
            <div className="bar-label">{g.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
