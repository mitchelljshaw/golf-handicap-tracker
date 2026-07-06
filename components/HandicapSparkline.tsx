
export function HandicapSparkline({ values }: { values: number[] }) { // Values are Differentials, not raw scores
  const width = 220;
  const height = 56;
  const padding = 6;

  if (values.length < 2) {
    return (
      <div className="flex h-14 w-[220px] items-center text-xs text-pencil">
        Log rounds to see your trend
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    // invert: lower differential (better) plots higher on the chart
    const y = padding + ((value - min) / range) * (height - padding * 2);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label="Handicap Index trend over recent rounds"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--color-fairway)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "url(#pencil-roughen)" }}
      />
      <circle cx={lastX} cy={lastY} r={3} fill="var(--color-clay)" />
      <filter id="pencil-roughen">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={4} />
        <feDisplacementMap in="SourceGraphic" scale={1.2} />
      </filter>
    </svg>
  );
}
