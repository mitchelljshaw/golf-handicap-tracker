/* Test for WHS Engine */

import assert from "node:assert";
import {
  calculateCourseHandicap,
  strokesReceived,
  netDoubleBogeyCap,
  adjustedGrossScore,
  scoreDifferential,
  calculateHandicapIndex,
  isExceptionalScore,
  calculateNineHoleCourseHandicap,
  expectedNineHoleDifferential,
  combinedEighteenHoleDifferential,
  determineCountingRounds,
  type HoleInfo,
} from "./whs";

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (err) {
    console.error(`FAIL - ${name}`);
    throw err;
  }
}

// Course Handicap = Index x (Slope / 113) + (Course Rating - Par)
// USGA worked example: Index 14.3, Slope 128, CR 71.8, Par 72 -> 16
check("course handicap: USGA worked example (index 14.3)", () => {
  const ch = calculateCourseHandicap({
    handicapIndex: 14.3,
    slopeRating: 128,
    courseRating: 71.8,
    par: 72,
  });
  assert.strictEqual(ch, 16);
});

// Second worked example: Index 18.3, Slope 131, CR 72.4, Par 72 -> 22
check("course handicap: worked example (index 18.3)", () => {
  const ch = calculateCourseHandicap({
    handicapIndex: 18.3,
    slopeRating: 131,
    courseRating: 72.4,
    par: 72,
  });
  assert.strictEqual(ch, 22);
});

// USGA example: Course Handicap of 15 -> 1 stroke on stroke index 1-15,
// none on 16-18.
check("strokes received: course handicap 15", () => {
  assert.strictEqual(strokesReceived(15, 10), 1);
  assert.strictEqual(strokesReceived(15, 15), 1);
  assert.strictEqual(strokesReceived(15, 16), 0);
  assert.strictEqual(strokesReceived(15, 18), 0);
});

// Course Handicap above 18: every hole gets 1, plus a 2nd on the hardest holes.
check("strokes received: course handicap 22", () => {
  assert.strictEqual(strokesReceived(22, 1), 2);
  assert.strictEqual(strokesReceived(22, 4), 2);
  assert.strictEqual(strokesReceived(22, 5), 1);
  assert.strictEqual(strokesReceived(22, 18), 1);
});

// USGA example: Course Handicap 15, par-4 hole, stroke index 10 -> max score 7
check("net double bogey cap: USGA par-4 / SI 10 / CH 15 example", () => {
  const hole: HoleInfo = { holeNumber: 10, par: 4, strokeIndex: 10 };
  assert.strictEqual(netDoubleBogeyCap(hole, 15, true), 7);
});

// Pre-establishment cap is flat Par + 5 regardless of course handicap.
check("net double bogey cap: no established index yet", () => {
  const hole: HoleInfo = { holeNumber: 1, par: 4, strokeIndex: 1 };
  assert.strictEqual(netDoubleBogeyCap(hole, 0, false), 9);
});

check("adjusted gross score: caps a blow-up hole", () => {
  const holes: HoleInfo[] = [
    { holeNumber: 1, par: 4, strokeIndex: 10 },
    { holeNumber: 2, par: 5, strokeIndex: 1 },
  ];
  // CH 15: hole 1 (SI 10) gets 1 stroke -> cap 7; hole 2 (SI 1) gets 1 stroke -> cap 8
  const ags = adjustedGrossScore(
    holes,
    [
      { holeNumber: 1, grossScore: 9 }, // capped to 7
      { holeNumber: 2, grossScore: 6 }, // under cap, counts as-is
    ],
    15,
    true
  );
  assert.strictEqual(ags, 13);
});

// (113/130) x (92 - 72.1), from CaddieHQ's worked example: AGS 92, CR 72.1, slope 130.
check("score differential: worked example (AGS 92, CR 72.1, slope 130)", () => {
  const diff = scoreDifferential(92, 72.1, 130);
  assert.strictEqual(diff, 17.3);
});

// Official Rule 5.2a worked example: 6 scores, lowest two averaged, -1.0 adjustment.
check("handicap index: official 6-score example", () => {
  const result = calculateHandicapIndex([18.4, 17.1, 21.0, 16.8, 22.3, 19.2]);
  assert.strictEqual(result.handicapIndex, 16.0);
  assert.strictEqual(result.scoresUsed, 2);
});

check("handicap index: fewer than 3 scores is not yet established", () => {
  const result = calculateHandicapIndex([20.1, 19.4]);
  assert.strictEqual(result.handicapIndex, null);
});

check("handicap index: 20 scores averages the lowest 8", () => {
  const differentials = [
    12.1, 13.4, 11.0, 14.8, 15.3, 10.2, 16.7, 12.9, 13.1, 14.0, 18.2, 19.1,
    20.0, 21.4, 22.3, 23.1, 24.0, 25.2, 26.1, 27.3,
  ];
  const result = calculateHandicapIndex(differentials);
  assert.strictEqual(result.scoresUsed, 8);
  assert.strictEqual(result.differentialsConsidered, 20);
});

check("exceptional score: flags a differential 7+ better than index", () => {
  assert.strictEqual(isExceptionalScore(10.0, 18.0), true);
  assert.strictEqual(isExceptionalScore(12.5, 18.0), false);
  assert.strictEqual(isExceptionalScore(10.0, null), false);
});

// USGA's own worked example (2024 revision FAQ): Index 14.0, 9-hole score of
// 41 rates to a 9-hole differential of 7.2, which combines to an 18-hole
// equivalent of 15.7. Nine-hole course rating/slope for that example aren't
// published, so this checks the combination step in isolation.
check("expected nine-hole differential + combination: USGA worked example", () => {
  const expected = expectedNineHoleDifferential(14.0);
  const combined = combinedEighteenHoleDifferential(7.2, 14.0);
  assert.strictEqual(Math.round(expected * 10) / 10, 8.5);
  assert.strictEqual(combined, 15.7);
});

// Independent worked example from a golfing forum, cross-checked against an
// independent online calculator: Index 14, nine-hole differential 6.96 ->
// combined 18-hole equivalent of 15.4.
check("combined eighteen-hole differential: second worked example", () => {
  assert.strictEqual(combinedEighteenHoleDifferential(6.96, 14), 15.4);
});

check("combined eighteen-hole differential: no index yet uses raw value", () => {
  assert.strictEqual(combinedEighteenHoleDifferential(9.1, null), 9.1);
});

// 9-hole Course Handicap is mathematically the 18-hole formula with a
// halved index -- confirms the delegation is wired correctly.
check("nine-hole course handicap: matches halved-index delegation", () => {
  const ch9 = calculateNineHoleCourseHandicap({
    handicapIndex: 20,
    nineSlopeRating: 125,
    nineCourseRating: 35.8,
    ninePar: 36,
  });
  const viaEighteenHoleFormula = calculateCourseHandicap({
    handicapIndex: 10,
    slopeRating: 125,
    courseRating: 35.8,
    par: 36,
  });
  assert.strictEqual(ch9, viaEighteenHoleFormula);
});

check("counting rounds: fewer than 3 rounds are all 'not yet established'", () => {
  const result = determineCountingRounds([
    { id: "a", differential: 20.1 },
    { id: "b", differential: 19.4 },
  ]);
  assert.ok(result.every((r) => r.status === "not_yet_established"));
});

check("counting rounds: matches the official 6-score example exactly", () => {
  const rounds = [
    { id: "r1", differential: 18.4 },
    { id: "r2", differential: 17.1 },
    { id: "r3", differential: 21.0 },
    { id: "r4", differential: 16.8 },
    { id: "r5", differential: 22.3 },
    { id: "r6", differential: 19.2 },
  ];
  const result = determineCountingRounds(rounds);
  const statusById = Object.fromEntries(result.map((r) => [r.roundId, r.status]));
  // Lowest two are r4 (16.8) and r2 (17.1) -- these are the ones averaged.
  assert.strictEqual(statusById.r4, "counting");
  assert.strictEqual(statusById.r2, "counting");
  assert.strictEqual(statusById.r1, "not_counting_low");
  assert.strictEqual(statusById.r3, "not_counting_low");
  assert.strictEqual(statusById.r5, "not_counting_low");
  assert.strictEqual(statusById.r6, "not_counting_low");
});

check("counting rounds: rounds beyond the most recent 20 are 'not counting (old)'", () => {
  const rounds = Array.from({ length: 22 }, (_, i) => ({ id: `r${i}`, differential: 15 + i }));
  const result = determineCountingRounds(rounds);
  const statusById = Object.fromEntries(result.map((r) => [r.roundId, r.status]));
  assert.strictEqual(statusById.r20, "not_counting_old");
  assert.strictEqual(statusById.r21, "not_counting_old");
  assert.notStrictEqual(statusById.r19, "not_counting_old");
});

check("counting rounds: a tie at the cutoff favours the more recent round", () => {
  // idx0-6: distinct low values 0-6. idx7 and idx8 both tie at 7 (idx7 is
  // more recent). idx9-19: distinct high values, none make the top 8.
  const values = [0, 1, 2, 3, 4, 5, 6, 7, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const rounds = values.map((differential, i) => ({ id: `r${i}`, differential }));
  const result = determineCountingRounds(rounds);
  const statusById = Object.fromEntries(result.map((r) => [r.roundId, r.status]));
  assert.strictEqual(statusById.r7, "counting"); // more recent of the tied pair
  assert.strictEqual(statusById.r8, "not_counting_low"); // older of the tied pair
  for (let i = 0; i <= 6; i++) assert.strictEqual(statusById[`r${i}`], "counting");
  for (let i = 9; i <= 19; i++) assert.strictEqual(statusById[`r${i}`], "not_counting_low");
});

console.log(`\n${passed} passed`);
