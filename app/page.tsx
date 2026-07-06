import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHandicapIndex, listRounds } from "@/lib/services/roundsService";
import { calculateHandicapIndex, determineCountingRounds } from "@/lib/whs";
import { Navbar } from "@/components/Navbar";
import { HandicapSparkline } from "@/components/HandicapSparkline";
import { DifferentialTrendChart } from "@/components/DifferentialTrendChart";
import { LinkButton } from "@/components/ui/Button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [handicap, rounds] = await Promise.all([
    getCurrentHandicapIndex(supabase, user!.id),
    listRounds(supabase, user!.id),
  ]);

  const recentDifferentials = rounds
    .slice(0, 20)
    .map((r) => Number(r.score_differential))
    .reverse();

  const chartData = rounds
    .slice(0, 20)
    .reverse()
    .map((r) => ({
      date: format(new Date(r.date_played), "d MMM"),
      differential: Number(r.score_differential),
    }));

  const bestDifferential =
    rounds.length > 0 ? Math.min(...rounds.map((r) => Number(r.score_differential))) : null;
  const averageGross =
    rounds.length > 0
      ? Math.round(rounds.reduce((sum, r) => sum + r.total_gross_score, 0) / rounds.length)
      : null;

  let latestRoundMovement: { status: string; delta: number } | null = null; // Record - Last Round
  if (rounds.length > 0 && handicap.handicapIndex !== null) {
    const withoutLatest = calculateHandicapIndex(
      rounds.slice(1).map((r) => Number(r.score_differential))
    );
    if (withoutLatest.handicapIndex !== null) {
      const [latestStatus] = determineCountingRounds(
        rounds.map((r) => ({ id: r.id, differential: Number(r.score_differential) }))
      );
      latestRoundMovement = {
        status: latestStatus.status,
        delta: Math.round((handicap.handicapIndex - withoutLatest.handicapIndex) * 10) / 10,
      };
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-10 flex flex-col items-start justify-between gap-8 border border-fairway bg-paper-raised p-8 sm:flex-row sm:items-center">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-pencil">
              Handicap Index
            </span>
            <div className="mt-1 font-[family-name:var(--font-display)] text-6xl leading-none text-fairway">
              {handicap.handicapIndex !== null ? handicap.handicapIndex.toFixed(1) : "—"}
            </div>
            {handicap.message ? (
              <p className="mt-2 max-w-xs text-sm text-pencil">{handicap.message}</p>
            ) : (
              <p className="mt-2 text-sm text-pencil">
                Best {handicap.scoresUsed} of your last {handicap.differentialsConsidered} rounds
              </p>
            )}
            {latestRoundMovement && (
              <p className="mt-1 text-sm text-pencil">
                Your latest round is{" "}
                <span className={latestRoundMovement.status === "counting" ? "text-fairway" : ""}>
                  {latestRoundMovement.status === "counting" ? "counting" : "not counting"}
                </span>
                {latestRoundMovement.delta !== 0 ? (
                  <>
                    {" "}
                    and{" "}
                    {latestRoundMovement.delta < 0
                      ? `lowered your index by ${Math.abs(latestRoundMovement.delta).toFixed(1)}`
                      : `raised your index by ${latestRoundMovement.delta.toFixed(1)}`}
                  </>
                ) : (
                  " and didn't move your index"
                )}
              </p>
            )}
          </div>
          <HandicapSparkline values={recentDifferentials} />
        </div>

        <div className="mb-10 grid grid-cols-1 divide-y divide-pencil-pale border border-pencil-pale bg-paper-raised sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <StatCell label="Rounds logged" value={String(rounds.length)} />
          <StatCell
            label="Best differential"
            value={bestDifferential !== null ? bestDifferential.toFixed(1) : "—"}
          />
          <StatCell label="Average gross score" value={averageGross !== null ? String(averageGross) : "—"} />
        </div>

        <section className="mb-10 border border-pencil-pale bg-paper-raised p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg text-ink">
            Score differential trend
          </h2>
          <DifferentialTrendChart data={chartData} />
        </section>

        <section className="border border-pencil-pale bg-paper-raised p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-ink">
              Recent rounds
            </h2>
            <div className="flex gap-3">
              <LinkButton href="/rounds" variant="secondary">
                View all
              </LinkButton>
              <LinkButton href="/rounds/new">Log a round</LinkButton>
            </div>
          </div>

          {rounds.length === 0 ? (
            <p className="py-8 text-center text-sm text-pencil">
              No rounds yet. Log your first round to start building a Handicap Index.
            </p>
          ) : (
            <ul className="divide-y divide-pencil-pale">
              {rounds.slice(0, 5).map((round) => (
                <li key={round.id}>
                  <Link
                    href={`/rounds/${round.id}`}
                    className="flex items-center justify-between py-3 hover:bg-paper"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{round.tee_set.course.name}</p>
                      <p className="text-xs text-pencil">
                        {format(new Date(round.date_played), "d MMM yyyy")} · {round.tee_set.name}
                      </p>
                    </div>
                    <div className="text-right font-mono text-sm tabular-nums">
                      <p className="text-ink">{round.total_gross_score}</p>
                      <p className="text-xs text-pencil">{Number(round.score_differential).toFixed(1)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-pencil">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-ink">{value}</p>
    </div>
  );
}
