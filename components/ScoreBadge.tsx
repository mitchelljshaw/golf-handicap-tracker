import { clsx } from "clsx";

export function ScoreBadge({ score, par }: { score: number; par: number }) { // Scorecard, circle for birdie or better
  const diff = score - par;

  if (diff === 0) {
    return <span className="font-mono tabular-nums">{score}</span>;
  }

  const isUnder = diff < 0;
  const isDouble = Math.abs(diff) >= 2;
  const colorClass = isUnder ? "border-clay text-clay" : "border-ink text-ink";
  const shapeClass = isUnder ? "rounded-full" : "rounded-none";

  return (
    <span
      className={clsx(
        "relative inline-flex h-6 w-6 items-center justify-center border font-mono text-sm tabular-nums",
        colorClass,
        shapeClass
      )}
    >
      {isDouble && (
        <span
          className={clsx(
            "absolute inset-[-3px] border",
            colorClass.split(" ")[0],
            shapeClass
          )}
          aria-hidden
        />
      )}
      {score}
    </span>
  );
}
