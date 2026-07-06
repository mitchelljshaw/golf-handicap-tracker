"use client";

import { useMemo, useState } from "react";
import { createRoundAction } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select } from "@/components/ui/Field";
import {
  adjustedGrossScore,
  calculateCourseHandicap,
  calculateNineHoleCourseHandicap,
  netDoubleBogeyCap,
  scoreDifferential,
  combinedEighteenHoleDifferential,
  type HoleInfo,
} from "@/lib/whs";
import { recommendClubsForHole, type ClubDistanceInput } from "@/lib/clubRecommendation";
import type { Course, TeeSetWithHoles, ClubDistance } from "@/lib/types";

interface Props {
  courses: (Course & { tee_sets: TeeSetWithHoles[] })[];
  currentHandicapIndex: number | null;
  clubs: ClubDistance[];
}

type NinePlayed = "front" | "back";

export function RoundForm({ courses, currentHandicapIndex, clubs }: Props) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const course = courses.find((c) => c.id === courseId) ?? courses[0];

  const [teeSetId, setTeeSetId] = useState(course?.tee_sets[0]?.id ?? "");
  const teeSet = course?.tee_sets.find((t) => t.id === teeSetId) ?? course?.tee_sets[0];

  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18);
  const [ninePlayed, setNinePlayed] = useState<NinePlayed>("front");

  const [datePlayed, setDatePlayed] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [scores, setScores] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clubDistances: ClubDistanceInput[] = useMemo(
    () => clubs.map((c) => ({ clubName: c.club_name, distanceMeters: c.typical_distance_meters })),
    [clubs]
  );

  const allHoles: HoleInfo[] = useMemo(
    () =>
      (teeSet?.holes ?? []).map((h) => ({
        holeNumber: h.hole_number,
        par: h.par,
        strokeIndex: h.stroke_index,
      })),
    [teeSet]
  );

  const isNine = holesPlayed === 9;
  const isFront = ninePlayed === "front";

  const nineAvailable = {
    front: teeSet?.front_course_rating != null && teeSet?.front_slope_rating != null,
    back: teeSet?.back_course_rating != null && teeSet?.back_slope_rating != null,
  };
  const anyNineAvailable = nineAvailable.front || nineAvailable.back;

  const holes = isNine
    ? allHoles.filter((h) => (isFront ? h.holeNumber <= 9 : h.holeNumber > 9))
    : allHoles;

  const handicapEstablished = currentHandicapIndex !== null;

  let courseHandicap = 0;
  let effectiveCourseRating = 0;
  let effectiveSlopeRating = 0;
  let ratingIssue: string | null = null;

  if (teeSet) {
    if (isNine) {
      const cr = isFront ? teeSet.front_course_rating : teeSet.back_course_rating;
      const sr = isFront ? teeSet.front_slope_rating : teeSet.back_slope_rating;
      if (cr == null || sr == null) {
        ratingIssue = `This tee doesn't have an official ${isFront ? "front" : "back"}-nine rating on file yet — add it via the course's entry to enable 9-hole rounds here.`;
      } else {
        effectiveCourseRating = cr;
        effectiveSlopeRating = sr;
        const ninePar = holes.reduce((sum, h) => sum + h.par, 0);
        courseHandicap = calculateNineHoleCourseHandicap({
          handicapIndex: currentHandicapIndex,
          nineSlopeRating: sr,
          nineCourseRating: cr,
          ninePar,
        });
      }
    } else {
      effectiveCourseRating = teeSet.course_rating;
      effectiveSlopeRating = teeSet.slope_rating;
      courseHandicap = calculateCourseHandicap({
        handicapIndex: currentHandicapIndex,
        slopeRating: teeSet.slope_rating,
        courseRating: teeSet.course_rating,
        par: teeSet.par,
      });
    }
  }

  const holeYardages = useMemo(() => {
    const map = new Map<number, number | null>();
    (teeSet?.holes ?? []).forEach((h) => map.set(h.hole_number, h.yardage_meters));
    return map;
  }, [teeSet]);

  const holeScores = holes
    .map((h) => ({ holeNumber: h.holeNumber, grossScore: Number(scores[h.holeNumber] || 0) }))
    .filter((s) => s.grossScore > 0);

  const allEntered = holeScores.length === holes.length && holes.length > 0;

  const preview =
    allEntered && !ratingIssue
      ? (() => {
          const ags = adjustedGrossScore(holes, holeScores, courseHandicap, handicapEstablished);
          const totalGross = holeScores.reduce((sum, s) => sum + s.grossScore, 0);
          const rawDifferential = scoreDifferential(ags, effectiveCourseRating, effectiveSlopeRating);
          const differential = isNine
            ? combinedEighteenHoleDifferential(rawDifferential, currentHandicapIndex)
            : rawDifferential;
          return { ags, totalGross, rawDifferential, differential };
        })()
      : null;

  function handleCourseChange(id: string) {
    setCourseId(id);
    const nextCourse = courses.find((c) => c.id === id);
    setTeeSetId(nextCourse?.tee_sets[0]?.id ?? "");
    setScores({});
  }

  function handleHolesPlayedChange(value: 9 | 18) {
    setHolesPlayed(value);
    setScores({});
    if (value === 9 && !nineAvailable.front && nineAvailable.back) setNinePlayed("back");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teeSet || !allEntered || ratingIssue) return;
    setSubmitting(true);
    setError(null);
    try {
      await createRoundAction({
        teeSetId: teeSet.id,
        datePlayed,
        notes,
        holesPlayed,
        ninePlayed: isNine ? ninePlayed : null,
        holeScores: holes.map((h) => ({
          holeNumber: h.holeNumber,
          grossScore: Number(scores[h.holeNumber]),
          putts: null,
        })),
      });
    } catch (err) {
      if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
        setError(err.message);
        setSubmitting(false);
      }
    }
  }

  if (!course || !teeSet) return null;

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-4 border border-clay bg-paper-raised px-4 py-3 text-sm text-clay">
          {error}
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 border border-pencil-pale bg-paper-raised p-6 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="course">Course</Label>
          <Select id="course" value={courseId} onChange={(e) => handleCourseChange(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="tee">Tee</Label>
          <Select id="tee" value={teeSetId} onChange={(e) => setTeeSetId(e.target.value)}>
            {course.tee_sets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · CR {Number(t.course_rating).toFixed(1)} · Slope {t.slope_rating}
              </option>
            ))}
          </Select>
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="holesPlayed">Holes played</Label>
          <Select
            id="holesPlayed"
            value={String(holesPlayed)}
            onChange={(e) => handleHolesPlayedChange(Number(e.target.value) as 9 | 18)}
          >
            <option value="18">18 holes</option>
            <option value="9" disabled={!anyNineAvailable}>
              9 holes{!anyNineAvailable ? " (no nine-hole rating on file)" : ""}
            </option>
          </Select>
        </FieldGroup>

        {isNine && (
          <FieldGroup>
            <Label htmlFor="ninePlayed">Which nine</Label>
            <Select
              id="ninePlayed"
              value={ninePlayed}
              onChange={(e) => setNinePlayed(e.target.value as NinePlayed)}
            >
              <option value="front" disabled={!nineAvailable.front}>
                Front 9 (holes 1–9){!nineAvailable.front ? " — unavailable" : ""}
              </option>
              <option value="back" disabled={!nineAvailable.back}>
                Back 9 (holes 10–18){!nineAvailable.back ? " — unavailable" : ""}
              </option>
            </Select>
          </FieldGroup>
        )}

        <FieldGroup>
          <Label htmlFor="date">Date played</Label>
          <Input
            id="date"
            type="date"
            value={datePlayed}
            onChange={(e) => setDatePlayed(e.target.value)}
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="courseHandicap">Your course handicap</Label>
          <Input id="courseHandicap" value={ratingIssue ? "—" : courseHandicap} disabled />
        </FieldGroup>
      </div>

      {ratingIssue && (
        <p className="mb-6 border border-clay bg-paper-raised px-4 py-3 text-sm text-clay">
          {ratingIssue}
        </p>
      )}

      {!ratingIssue && (
        <div className="mb-6 border border-pencil-pale bg-paper-raised p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-ink">
              Hole scores
            </h2>
            {!handicapEstablished && (
              <span className="text-xs text-pencil">
                No Handicap Index yet, capping every hole at par + 5
              </span>
            )}
          </div>

          <div className={isNine ? "" : "grid grid-cols-1 gap-x-8 sm:grid-cols-2"}>
            {(isNine ? [holes] : [holes.slice(0, 9), holes.slice(9, 18)]).map((half, halfIndex) => (
              <table key={halfIndex} className="w-full text-sm">
                <thead>
                  <tr className="font-mono text-xs uppercase tracking-wider text-pencil">
                    <th className="py-1 text-left font-medium">Hole</th>
                    <th className="py-1 text-left font-medium">Par</th>
                    <th className="py-1 text-left font-medium">Cap</th>
                    <th className="py-1 text-left font-medium">Score</th>
                    {clubDistances.length > 0 && (
                      <th className="py-1 text-left font-medium">Suggested club</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {half.map((hole) => {
                    const cap = netDoubleBogeyCap(hole, courseHandicap, handicapEstablished);
                    const yardage = holeYardages.get(hole.holeNumber) ?? null;
                    const rec =
                      clubDistances.length > 0
                        ? recommendClubsForHole(yardage, hole.par, clubDistances)
                        : null;
                    return (
                      <tr key={hole.holeNumber}>
                        <td className="py-1 pr-2 font-mono">{hole.holeNumber}</td>
                        <td className="py-1 pr-2 font-mono text-pencil">{hole.par}</td>
                        <td className="py-1 pr-2 font-mono text-pencil">{cap}</td>
                        <td className="py-1 pr-2">
                          <Input
                            type="number"
                            min={1}
                            max={15}
                            value={scores[hole.holeNumber] ?? ""}
                            onChange={(e) =>
                              setScores((prev) => ({ ...prev, [hole.holeNumber]: e.target.value }))
                            }
                            className="w-16 py-1"
                            required
                          />
                        </td>
                        {clubDistances.length > 0 && (
                          <td className="py-1 pr-2 text-xs text-pencil" title={rec?.teeReason ?? ""}>
                            {rec ? (
                              <>
                                <span className="text-ink">{rec.teeClub}</span>
                                {rec.approachClub && (
                                  <span> → {rec.approachClub}</span>
                                )}
                              </>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}
          </div>
          {clubDistances.length === 0 && (
            <p className="mt-4 text-xs text-pencil">
              Add your club distances on the{" "}
              <a href="/clubs" className="text-fairway hover:underline">
                My Bag
              </a>{" "}
              page to see a suggested club per hole.
            </p>
          )}
        </div>
      )}

      {preview && (
        <div className="mb-6 border border-fairway bg-paper-raised">
          <div className="grid grid-cols-3 divide-x divide-pencil-pale">
            <PreviewCell label="Gross" value={String(preview.totalGross)} />
            <PreviewCell label="Adjusted" value={String(preview.ags)} />
            <PreviewCell
              label={isNine ? "9-hole differential" : "Differential"}
              value={preview.rawDifferential.toFixed(1)}
            />
          </div>
          {isNine && (
            <p className="border-t border-pencil-pale px-4 py-2 text-center text-xs text-pencil">
              Combines with your expected score to post an 18-hole-equivalent differential of{" "}
              <span className="font-mono text-ink">{preview.differential.toFixed(1)}</span> (Rule
              5.1b)
            </p>
          )}
        </div>
      )}

      <div className="mb-6">
        <FieldGroup>
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-sm border border-pencil-pale bg-paper-raised px-3 py-2 text-ink placeholder:text-pencil focus:border-fairway"
            placeholder="Windy back nine, three-putted 14…"
          />
        </FieldGroup>
      </div>

      <Button type="submit" disabled={submitting || !allEntered || !!ratingIssue}>
        {submitting ? "Saving…" : "Save round"}
      </Button>
    </form>
  );
}

function PreviewCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-pencil">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-fairway">{value}</p>
    </div>
  );
}
