"use client";

import { useMemo, useState } from "react";
import { updateHoleYardageAction } from "@/app/actions";
import { recommendClubsForHole, type ClubDistanceInput } from "@/lib/clubRecommendation";
import { Label, Select } from "@/components/ui/Field";
import type { Course, TeeSetWithHoles } from "@/lib/types";

interface Props {
  course: Course & { tee_sets: TeeSetWithHoles[] };
  clubs: ClubDistanceInput[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function CourseGuide({ course, clubs }: Props) {
  const [teeSetId, setTeeSetId] = useState(course.tee_sets[0]?.id ?? "");
  const teeSet = course.tee_sets.find((t) => t.id === teeSetId) ?? course.tee_sets[0];

  const [overrides, setOverrides] = useState<Record<string, number | null>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});

  const rows = useMemo(() => {
    if (!teeSet) return [];
    return teeSet.holes.map((hole) => {
      const effectiveYardage = hole.id in overrides ? overrides[hole.id] : hole.yardage_meters;
      return {
        hole,
        effectiveYardage,
        rec:
          clubs.length > 0 ? recommendClubsForHole(effectiveYardage, hole.par, clubs) : null,
      };
    });
  }, [teeSet, clubs, overrides]);

  if (!teeSet) return null;

  const front = rows.filter((r) => r.hole.hole_number <= 9);
  const back = rows.filter((r) => r.hole.hole_number > 9);
  const anyYardage = rows.some((r) => r.effectiveYardage !== null);

  async function handleSave(holeId: string) {
    const raw = drafts[holeId];
    const value = raw === "" || raw === undefined ? null : Number(raw);
    if (value !== null && (Number.isNaN(value) || value < 15 || value > 650)) {
      setSaveState((prev) => ({ ...prev, [holeId]: "error" }));
      return;
    }
    setSaveState((prev) => ({ ...prev, [holeId]: "saving" }));
    try {
      await updateHoleYardageAction(holeId, value);
      setOverrides((prev) => ({ ...prev, [holeId]: value }));
      setSaveState((prev) => ({ ...prev, [holeId]: "saved" }));
      setTimeout(() => setSaveState((prev) => ({ ...prev, [holeId]: "idle" })), 1500);
    } catch {
      setSaveState((prev) => ({ ...prev, [holeId]: "error" }));
    }
  }

  return (
    <div>
      {course.tee_sets.length > 1 && (
        <div className="mb-6 max-w-xs">
          <Label htmlFor="teeSelect">Tee</Label>
          <Select id="teeSelect" value={teeSetId} onChange={(e) => setTeeSetId(e.target.value)}>
            {course.tee_sets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · CR {Number(t.course_rating).toFixed(1)} · Slope {t.slope_rating}
              </option>
            ))}
          </Select>
        </div>
      )}

      {clubs.length === 0 && (
        <p className="mb-6 border border-pencil-pale bg-paper-raised px-4 py-3 text-sm text-pencil">
          Add your club distances on the{" "}
          <a href="/clubs" className="text-fairway hover:underline">
            My Bag
          </a>{" "}
          page to see a suggested club for each hole.
        </p>
      )}

      {clubs.length > 0 && !anyYardage && (
        <p className="mb-6 border border-pencil-pale bg-paper-raised px-4 py-3 text-sm text-pencil">
          No hole distances. Enter one below (e.g. straight off the marker at the
          tee) and it&apos;ll be saved for next time.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[
          { title: "Front nine", data: front },
          { title: "Back nine", data: back },
        ].map(
          ({ title, data }) =>
            data.length > 0 && (
              <div key={title} className="border border-pencil-pale bg-paper-raised">
                <h2 className="border-b border-pencil-pale px-4 py-3 font-[family-name:var(--font-display)] text-ink">
                  {title}
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pencil-pale font-mono text-xs uppercase tracking-wider text-pencil">
                      <th className="px-4 py-2 text-left font-medium">Hole</th>
                      <th className="px-4 py-2 text-left font-medium">Par</th>
                      <th className="px-4 py-2 text-left font-medium">Metres</th>
                      <th className="px-4 py-2 text-left font-medium">Suggested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pencil-pale">
                    {data.map(({ hole, effectiveYardage, rec }) => {
                      const draft = drafts[hole.id] ?? String(effectiveYardage ?? "");
                      const dirty = draft !== String(effectiveYardage ?? "");
                      const state = saveState[hole.id] ?? "idle";
                      return (
                        <tr key={hole.id}>
                          <td className="px-4 py-2 font-mono">{hole.hole_number}</td>
                          <td className="px-4 py-2 font-mono text-pencil">{hole.par}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={15}
                                max={650}
                                placeholder="—"
                                value={draft}
                                onChange={(e) =>
                                  setDrafts((prev) => ({ ...prev, [hole.id]: e.target.value }))
                                }
                                className="w-16 rounded-sm border border-pencil-pale bg-paper px-2 py-1 font-mono text-sm text-ink"
                              />
                              {dirty && (
                                <button
                                  type="button"
                                  onClick={() => handleSave(hole.id)}
                                  disabled={state === "saving"}
                                  className="text-xs text-fairway hover:underline"
                                >
                                  {state === "saving" ? "…" : "Save"}
                                </button>
                              )}
                              {!dirty && state === "saved" && (
                                <span className="text-xs text-fairway">Saved</span>
                              )}
                              {state === "error" && (
                                <span className="text-xs text-clay">Invalid</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs" title={rec?.teeReason ?? ""}>
                            {rec ? (
                              <>
                                <span className="text-ink">{rec.teeClub}</span>
                                {rec.approachClub && (
                                  <span className="text-pencil"> → {rec.approachClub}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-pencil">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>
    </div>
  );
}
