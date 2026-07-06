"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseAction } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label } from "@/components/ui/Field";

interface HoleRow {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  yardageMeters: string;
}

function defaultHoles(): HoleRow[] {
  return Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    strokeIndex: i + 1,
    yardageMeters: "",
  }));
}

export function CourseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [teeName, setTeeName] = useState("Blue");
  const [courseRating, setCourseRating] = useState("71.5");
  const [slopeRating, setSlopeRating] = useState("125");
  const [showNineRatings, setShowNineRatings] = useState(false);
  const [frontCourseRating, setFrontCourseRating] = useState("");
  const [frontSlopeRating, setFrontSlopeRating] = useState("");
  const [backCourseRating, setBackCourseRating] = useState("");
  const [backSlopeRating, setBackSlopeRating] = useState("");
  const [holes, setHoles] = useState<HoleRow[]>(defaultHoles());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parTotal = useMemo(() => holes.reduce((sum, h) => sum + h.par, 0), [holes]);

  const strokeIndexIssue = useMemo(() => {
    const indices = holes.map((h) => h.strokeIndex).sort((a, b) => a - b);
    const expected = Array.from({ length: 18 }, (_, i) => i + 1);
    const isValidPermutation = indices.every((v, i) => v === expected[i]);
    return isValidPermutation
      ? null
      : "Stroke indexes must be a permutation of 1–18, each used exactly once.";
  }, [holes]);

  function updateHole(index: number, field: "par" | "strokeIndex" | "yardageMeters", value: string | number) {
    setHoles((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (strokeIndexIssue) return;
    setSubmitting(true);
    setError(null);
    try {
      await createCourseAction({
        name,
        location,
        teeSets: [
          {
            name: teeName,
            courseRating: parseFloat(courseRating),
            slopeRating: parseInt(slopeRating, 10),
            par: parTotal,
            frontCourseRating: frontCourseRating ? parseFloat(frontCourseRating) : null,
            frontSlopeRating: frontSlopeRating ? parseInt(frontSlopeRating, 10) : null,
            backCourseRating: backCourseRating ? parseFloat(backCourseRating) : null,
            backSlopeRating: backSlopeRating ? parseInt(backSlopeRating, 10) : null,
            holes: holes.map((h) => ({
              holeNumber: h.holeNumber,
              par: h.par,
              strokeIndex: h.strokeIndex,
              yardageMeters: h.yardageMeters ? parseInt(h.yardageMeters, 10) : null,
            })),
          },
        ],
      });
    } catch (err) {
      // redirect() inside the server action throws internally on success — only
      // treat this as a real failure if it isn't that.
      if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
        setError(err.message);
        setSubmitting(false);
      }
    }
  }

  return (
    <>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl text-ink">
        Add course
      </h1>

      {error && (
        <p className="mb-4 border border-clay bg-paper-raised px-4 py-3 text-sm text-clay">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-1 gap-4 border border-pencil-pale bg-paper-raised p-6 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="name">Course name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sydney, NSW"
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="teeName">Tee name</Label>
            <Input id="teeName" value={teeName} onChange={(e) => setTeeName(e.target.value)} required />
          </FieldGroup>
          <div />
          <FieldGroup>
            <Label htmlFor="courseRating">Course rating (18 holes)</Label>
            <Input
              id="courseRating"
              type="number"
              step="0.1"
              min="55"
              max="85"
              value={courseRating}
              onChange={(e) => setCourseRating(e.target.value)}
              required
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="slopeRating">Slope rating (18 holes)</Label>
            <Input
              id="slopeRating"
              type="number"
              min="55"
              max="155"
              value={slopeRating}
              onChange={(e) => setSlopeRating(e.target.value)}
              required
            />
          </FieldGroup>
        </div>

        <div className="mb-6 border border-pencil-pale bg-paper-raised p-6">
          <button
            type="button"
            onClick={() => setShowNineRatings((v) => !v)}
            className="mb-2 text-sm text-fairway hover:underline"
          >
            {showNineRatings ? "− Hide" : "+ Add"} separate front/back nine ratings (optional)
          </button>
          <p className="mb-4 text-xs text-pencil">
            Fill these in from the card if you want rounds at this tee set to be scored for handicap purposes as two separate 9-hole rounds, rather than one 18-hole round.
          </p>

          {showNineRatings && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FieldGroup>
                <Label htmlFor="frontCR">Front 9 rating</Label>
                <Input
                  id="frontCR"
                  type="number"
                  step="0.1"
                  value={frontCourseRating}
                  onChange={(e) => setFrontCourseRating(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="frontSlope">Front 9 slope</Label>
                <Input
                  id="frontSlope"
                  type="number"
                  value={frontSlopeRating}
                  onChange={(e) => setFrontSlopeRating(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="backCR">Back 9 rating</Label>
                <Input
                  id="backCR"
                  type="number"
                  step="0.1"
                  value={backCourseRating}
                  onChange={(e) => setBackCourseRating(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="backSlope">Back 9 slope</Label>
                <Input
                  id="backSlope"
                  type="number"
                  value={backSlopeRating}
                  onChange={(e) => setBackSlopeRating(e.target.value)}
                />
              </FieldGroup>
            </div>
          )}
        </div>

        <div className="mb-6 border border-pencil-pale bg-paper-raised p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-ink">
              Holes par, stroke index &amp; distance
            </h2>
            <span className="font-mono text-sm text-pencil">Par total: {parTotal}</span>
          </div>

          {strokeIndexIssue && (
            <p className="mb-4 border border-clay px-3 py-2 text-sm text-clay">
              {strokeIndexIssue}
            </p>
          )}

          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {[holes.slice(0, 9), holes.slice(9, 18)].map((half, halfIndex) => (
              <table key={halfIndex} className="w-full text-sm">
                <thead>
                  <tr className="font-mono text-xs uppercase tracking-wider text-pencil">
                    <th className="py-1 text-left font-medium">Hole</th>
                    <th className="py-1 text-left font-medium">Par</th>
                    <th className="py-1 text-left font-medium">SI</th>
                    <th className="py-1 text-left font-medium">Metres</th>
                  </tr>
                </thead>
                <tbody>
                  {half.map((hole) => {
                    const index = holes.findIndex((h) => h.holeNumber === hole.holeNumber);
                    return (
                      <tr key={hole.holeNumber}>
                        <td className="py-1 pr-2 font-mono">{hole.holeNumber}</td>
                        <td className="py-1 pr-2">
                          <Input
                            type="number"
                            min={3}
                            max={6}
                            value={hole.par}
                            onChange={(e) => updateHole(index, "par", Number(e.target.value))}
                            className="w-14 py-1"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <Input
                            type="number"
                            min={1}
                            max={18}
                            value={hole.strokeIndex}
                            onChange={(e) =>
                              updateHole(index, "strokeIndex", Number(e.target.value))
                            }
                            className="w-14 py-1"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <Input
                            type="number"
                            min={0}
                            max={650}
                            placeholder="optional"
                            value={hole.yardageMeters}
                            onChange={(e) => updateHole(index, "yardageMeters", e.target.value)}
                            className="w-20 py-1"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting || !!strokeIndexIssue}>
            {submitting ? "Saving…" : "Save course"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
