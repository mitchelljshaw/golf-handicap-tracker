"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  date: string;
  differential: number;
}

export function DifferentialTrendChart({ data }: { data: Point[] }) {
  if (data.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-pencil">
        Score differentials will chart here once you&apos;ve logged a few rounds.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--color-pencil-pale)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--color-pencil)" }}
          axisLine={{ stroke: "var(--color-pencil-pale)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--color-pencil)" }}
          axisLine={false}
          tickLine={false}
          reversed
          width={32}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-paper-raised)",
            border: "1px solid var(--color-pencil-pale)",
            borderRadius: 2,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--color-ink)" }}
        />
        <Line
          type="monotone"
          dataKey="differential"
          stroke="var(--color-fairway)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-fairway)" }}
          activeDot={{ r: 5, fill: "var(--color-clay)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
