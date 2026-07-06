"use client";

import { useState } from "react";
import { addClubDistanceAction, deleteClubDistanceAction } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label } from "@/components/ui/Field";
import type { ClubDistance } from "@/lib/types";

const SUGGESTED_CLUBS = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "3 Hybrid",
  "4 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "Pitching Wedge",
  "Gap Wedge",
  "Sand Wedge",
  "Lob Wedge",
];

export function ClubBagForm({ clubs }: { clubs: ClubDistance[] }) {
  const [clubName, setClubName] = useState("");
  const [distance, setDistance] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const usedNames = new Set(clubs.map((c) => c.club_name));
  const suggestions = SUGGESTED_CLUBS.filter((c) => !usedNames.has(c));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubName || !distance) return;
    setSubmitting(true);
    await addClubDistanceAction({ clubName, typicalDistanceMeters: Number(distance) });
    setClubName("");
    setDistance("");
    setSubmitting(false);
  }

  return (
    <div>
      <div className="mb-6 border border-pencil-pale bg-paper-raised p-6">
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg text-ink">
          Add a club
        </h2>
        <p className="mb-4 text-sm text-pencil">
          Your typical total distance in metres — the number you&apos;d expect on a normal, flat,
          no-wind shot. Used only for the club recommendation on the &quot;Log a round&quot; screen.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <FieldGroup>
            <Label htmlFor="clubName">Club</Label>
            <Input
              id="clubName"
              list="club-suggestions"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="7 Iron"
              className="w-40"
              required
            />
            <datalist id="club-suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="distance">Distance (m)</Label>
            <Input
              id="distance"
              type="number"
              min={15}
              max={350}
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-28"
              required
            />
          </FieldGroup>
          <Button type="submit" disabled={submitting} className="mb-4">
            {submitting ? "Saving…" : "Add club"}
          </Button>
        </form>
      </div>

      <div className="border border-pencil-pale bg-paper-raised">
        {clubs.length === 0 ? (
          <p className="py-12 text-center text-sm text-pencil">
            No clubs added. Add your driver and a few irons to start seeing recommendations.
          </p>
        ) : (
          <ul className="divide-y divide-pencil-pale">
            {clubs.map((club) => (
              <li key={club.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-ink">{club.club_name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-pencil">
                    {club.typical_distance_meters}m
                  </span>
                  <form action={deleteClubDistanceAction.bind(null, club.id)}>
                    <button
                      type="submit"
                      className="text-xs text-clay hover:underline"
                      aria-label={`Remove ${club.club_name}`}
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
