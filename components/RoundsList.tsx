"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Select } from "@/components/ui/Field";
import { determineCountingRounds, type RoundCountingStatus } from "@/lib/whs";
import type { Round } from "@/lib/types";

type RoundRow = Round & { tee_set: { name: string; course: { id: string; name: string } } };

const STATUS_LABEL: Record<RoundCountingStatus, string> = {
  counting: "Counting",
  not_counting_low: "Not counting",
  not_counting_old: "Not counting",
  not_yet_established: "Building index",
};

const STATUS_TITLE: Record<RoundCountingStatus, string> = {
  counting: "One of your best differentials right now — this round is part of your Handicap Index",
  not_counting_low: "Within your last 20 rounds, but not among the best ones averaged",
  not_counting_old: "Outside your most recent 20 rounds",
  not_yet_established: "You need at least 3 rounds before a Handicap Index can be established",
};

const STATUS_CLASS: Record<RoundCountingStatus, string> = {
  counting: "text-fairway",
  not_counting_low: "text-pencil",
  not_counting_old: "text-pencil",
  not_yet_established: "text-pencil",
};

export function RoundsList({ rounds }: { rounds: RoundRow[] }) {
  const countingStatusById = useMemo(() => {
    const results = determineCountingRounds(
      rounds.map((r) => ({ id: r.id, differential: Number(r.score_differential) }))
    );
    return new Map(results.map((r) => [r.roundId, r.status]));
  }, [rounds]);

  const courses = useMemo(() => {
    const seen = new Map<string, string>();
    rounds.forEach((r) => seen.set(r.tee_set.course.id, r.tee_set.course.name));
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [rounds]);

  const [courseId, setCourseId] = useState<string>("all");

  const filtered =
    courseId === "all" ? rounds : rounds.filter((r) => r.tee_set.course.id === courseId);

  return (
    <div>
      {courses.length > 1 && (
        <div className="mb-4 max-w-xs">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="border border-pencil-pale bg-paper-raised py-12 text-center text-sm text-pencil">
          No rounds logged at this course yet! 
        </p>
      ) : (
        <div className="overflow-x-auto border border-pencil-pale bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-pencil-pale font-mono text-xs uppercase tracking-wider text-pencil">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Tee</th>
                <th className="px-4 py-3 font-medium">Holes</th>
                <th className="px-4 py-3 text-right font-medium">Gross</th>
                <th className="px-4 py-3 text-right font-medium">Adjusted</th>
                <th className="px-4 py-3 text-right font-medium">Differential</th>
                <th className="px-4 py-3 text-right font-medium">Cse. Hcp.</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pencil-pale">
              {filtered.map((round) => (
                <tr key={round.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/rounds/${round.id}`} className="hover:underline">
                      {format(new Date(round.date_played), "d MMM yyyy")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{round.tee_set.course.name}</td>
                  <td className="px-4 py-3 text-pencil">{round.tee_set.name}</td>
                  <td className="px-4 py-3 text-pencil">
                    {round.holes_played === 9
                      ? `9 (${round.nine_played === "front" ? "F" : "B"})`
                      : "18"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {round.total_gross_score}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {round.adjusted_gross_score}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {Number(round.score_differential).toFixed(1)}
                    {round.is_exceptional && (
                      <span
                        className="ml-1 text-clay"
                        title="Exceptional score: 7.0+ strokes better than Handicap Index at the time"
                      >
                        *
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {round.course_handicap}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const status = countingStatusById.get(round.id) ?? "not_yet_established";
                      return (
                        <span
                          className={`text-xs ${STATUS_CLASS[status]}`}
                          title={STATUS_TITLE[status]}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {courseId !== "all" && filtered.length > 1 && (
            <div className="border-t border-pencil-pale bg-paper px-4 py-3 text-xs text-pencil">
              {filtered.length} rounds here · best gross{" "}
              <span className="font-mono text-ink">
                {Math.min(...filtered.map((r) => r.total_gross_score))}
              </span>{" "}
              · best differential{" "}
              <span className="font-mono text-ink">
                {Math.min(...filtered.map((r) => Number(r.score_differential))).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
