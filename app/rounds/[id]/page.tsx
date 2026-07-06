import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getRound } from "@/lib/services/roundsService";
import { deleteRoundAction } from "@/app/actions";
import { Navbar } from "@/components/Navbar";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Button } from "@/components/ui/Button";

export default async function RoundDetailPage({ // Round Details page for round summaries
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const round = await getRound(supabase, id);
  if (!round) notFound();

  const holes = round.round_holes;
  const front9 = holes.filter((h) => h.hole_number <= 9);
  const back9 = holes.filter((h) => h.hole_number > 9);

  const cappedHoles = holes.filter((h) => h.gross_score > h.net_double_bogey_cap);
  const strokesAdjusted = cappedHoles.reduce(
    (sum, h) => sum + (h.gross_score - h.net_double_bogey_cap),
    0
  );
  const cappedHoleList = formatHoleList(cappedHoles.map((h) => h.hole_number));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-ink">
              {round.tee_set.course.name}
            </h1>
            <p className="text-sm text-pencil">
              {format(new Date(round.date_played), "EEEE d MMMM yyyy")} · {round.tee_set.name} tees
              ·{" "}
              {round.holes_played === 9
                ? `${round.nine_played === "front" ? "Front" : "Back"} 9`
                : "18 holes"}
            </p>
          </div>
          <form action={deleteRoundAction.bind(null, round.id)}>
            <Button type="submit" variant="danger">
              Delete round
            </Button>
          </form>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-px border border-pencil-pale bg-pencil-pale sm:grid-cols-4">
          <Summary label="Gross" value={String(round.total_gross_score)} />
          <Summary label="Adjusted" value={String(round.adjusted_gross_score)} />
          <Summary
            label={round.holes_played === 9 ? "18-hole equiv." : "Differential"}
            value={Number(round.score_differential).toFixed(1)}
          />
          <Summary label="Course Hcp." value={String(round.course_handicap)} />
        </div>

        <p className="mb-8 border border-pencil-pale bg-paper-raised px-4 py-3 text-sm text-ink">
          {cappedHoles.length === 0 ? (
            <>
              No holes needed capping — your gross score of{" "}
              <span className="font-mono">{round.total_gross_score}</span> counts in full for
              handicap purposes.
            </>
          ) : (
            <>
              Hole{cappedHoles.length > 1 ? "s" : ""}{" "}
              <span className="font-mono">{cappedHoleList}</span>{" "}
              {cappedHoles.length > 1 ? "were" : "was"} capped at net double bogey, adjusting your
              gross score of <span className="font-mono">{round.total_gross_score}</span> down to{" "}
              <span className="font-mono">{round.adjusted_gross_score}</span> (
              {strokesAdjusted} stroke{strokesAdjusted !== 1 ? "s" : ""} removed) for handicap
              purposes.
            </>
          )}
        </p>

        {round.holes_played === 9 && round.raw_nine_hole_differential !== null && (
          <p className="mb-8 border border-pencil-pale bg-paper-raised px-4 py-3 text-sm text-pencil">
            Raw 9-hole differential:{" "}
            <span className="font-mono text-ink">
              {Number(round.raw_nine_hole_differential).toFixed(1)}
            </span>{" "}
            — combined with your expected score for the unplayed nine (Rule 5.1b) to post an
            18-hole-equivalent differential of{" "}
            <span className="font-mono text-ink">
              {Number(round.score_differential).toFixed(1)}
            </span>
            .
          </p>
        )}

        {round.is_exceptional && (
          <p className="mb-8 border border-clay bg-paper-raised px-4 py-3 text-sm text-clay">
            Flagged as an exceptional score — 7.0 or more strokes better than the Handicap
            Index in effect that day.
          </p>
        )}

        {round.notes && (
          <p className="mb-8 border border-pencil-pale bg-paper-raised px-4 py-3 text-sm text-ink">
            {round.notes}
          </p>
        )}

        <div className="space-y-6">
          <HoleTable title="Front nine" holes={front9} />
          <HoleTable title="Back nine" holes={back9} />
        </div>
      </main>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper-raised p-4 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-pencil">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-ink">{value}</p>
    </div>
  );
}

/** "6" / "6 and 14" / "6, 14 and 17" -- proper English list joining, not just " and " everywhere. */
function formatHoleList(holeNumbers: number[]): string {
  if (holeNumbers.length <= 1) return holeNumbers.join("");
  if (holeNumbers.length === 2) return holeNumbers.join(" and ");
  return `${holeNumbers.slice(0, -1).join(", ")} and ${holeNumbers[holeNumbers.length - 1]}`;
}

function HoleTable({
  title,
  holes,
}: {
  title: string;
  holes: {
    hole_number: number;
    par: number;
    gross_score: number;
    adjusted_score: number;
    net_double_bogey_cap: number;
  }[];
}) {
  if (holes.length === 0) return null;

  const parTotal = holes.reduce((sum, h) => sum + h.par, 0);
  const grossTotal = holes.reduce((sum, h) => sum + h.gross_score, 0);

  return (
    <div className="border border-pencil-pale bg-paper-raised">
      <h2 className="border-b border-pencil-pale px-4 py-3 font-[family-name:var(--font-display)] text-ink">
        {title} <span className="text-sm font-normal text-pencil">(par {parTotal})</span>
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pencil-pale font-mono text-xs uppercase tracking-wider text-pencil">
            <th className="px-4 py-2 text-left font-medium">Hole</th>
            <th className="px-4 py-2 text-right font-medium">Par</th>
            <th className="px-4 py-2 text-right font-medium">Gross</th>
            <th className="px-4 py-2 text-right font-medium">Capped at</th>
            <th className="px-4 py-2 text-right font-medium">Adjusted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pencil-pale">
          {holes.map((hole) => {
            const wasCapped = hole.gross_score > hole.net_double_bogey_cap;
            return (
              <tr key={hole.hole_number}>
                <td className="px-4 py-2 font-mono">{hole.hole_number}</td>
                <td className="px-4 py-2 text-right font-mono text-pencil tabular-nums">
                  {hole.par}
                </td>
                <td className="px-4 py-2 text-right">
                  <ScoreBadge score={hole.gross_score} par={hole.par} />
                </td>
                <td className="px-4 py-2 text-right font-mono text-pencil tabular-nums">
                  {hole.net_double_bogey_cap}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {hole.adjusted_score}
                  {wasCapped && (
                    <span className="ml-1 text-clay" title="Capped by net double bogey">
                      *
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          <tr className="font-medium">
            <td className="px-4 py-2 font-mono">Total</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">{parTotal}</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">{grossTotal}</td>
            <td />
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
