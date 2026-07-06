/* World Handicap System (WHS) calculation engine */

export interface HoleInfo {
  holeNumber: number;
  par: number;
  strokeIndex: number;
}

export interface HoleScore {
  holeNumber: number;
  grossScore: number;
}

export interface CourseHandicapInput {
  handicapIndex: number | null;
  slopeRating: number;
  courseRating: number;
  par: number;
}

/* Course Handicap = Handicap Index x (Slope Rating / 113) + (Course Rating - Par) */
export function calculateCourseHandicap({
  handicapIndex,
  slopeRating,
  courseRating,
  par,
}: CourseHandicapInput): number {
  const index = handicapIndex ?? 0;
  const raw = index * (slopeRating / 113) + (courseRating - par);
  return Math.round(raw);
}

export function strokesReceived(courseHandicap: number, strokeIndex: number): number {
  const ch = Math.max(courseHandicap, 0);
  const fullRounds = Math.floor(ch / 18);
  const remainder = ch % 18;
  return fullRounds + (strokeIndex <= remainder ? 1 : 0);
}

export function netDoubleBogeyCap(
  hole: HoleInfo,
  courseHandicap: number,
  handicapEstablished: boolean
): number {
  if (!handicapEstablished) return hole.par + 5;
  return hole.par + 2 + strokesReceived(courseHandicap, hole.strokeIndex);
}

export function adjustedGrossScore(
  holes: HoleInfo[],
  scores: HoleScore[],
  courseHandicap: number,
  handicapEstablished: boolean
): number {
  return scores.reduce((total, score) => {
    const hole = holes.find((h) => h.holeNumber === score.holeNumber);
    if (!hole) return total;
    const cap = netDoubleBogeyCap(hole, courseHandicap, handicapEstablished);
    return total + Math.min(score.grossScore, cap);
  }, 0);
}

/* Score Differential = (113 / Slope Rating) x (Adjusted Gross Score - Course Rating - PCC) */
export function scoreDifferential(
  adjustedGross: number,
  courseRating: number,
  slopeRating: number
): number {
  const raw = (113 / slopeRating) * (adjustedGross - courseRating);
  return Math.round(raw * 10) / 10;
}

export function isExceptionalScore(
  differential: number,
  handicapIndexAtTime: number | null
): boolean {
  if (handicapIndexAtTime === null) return false;
  return handicapIndexAtTime - differential >= 7.0;
}

export type RoundCountingStatus =
  | "counting"
  | "not_counting_low"
  | "not_counting_old"
  | "not_yet_established";

export interface RoundCountingResult {
  roundId: string;
  status: RoundCountingStatus;
}

export function determineCountingRounds(
  rounds: { id: string; differential: number }[]
): RoundCountingResult[] {
  if (rounds.length === 0) return [];

  const windowed = rounds.slice(0, 20);
  const outsideWindow = rounds.slice(20);

  if (windowed.length < 3) {
    return [
      ...windowed.map((r) => ({ roundId: r.id, status: "not_yet_established" as const })),
      ...outsideWindow.map((r) => ({ roundId: r.id, status: "not_counting_old" as const })),
    ];
  }

  const { scoresUsed } = calculateHandicapIndex(windowed.map((r) => r.differential));

  const indices = windowed.map((_, i) => i);
  indices.sort((a, b) => {
    const delta = windowed[a].differential - windowed[b].differential;
    return delta !== 0 ? delta : a - b; 
  });
  const countingIndices = new Set(indices.slice(0, scoresUsed));

  return [
    ...windowed.map((r, i) => ({
      roundId: r.id,
      status: countingIndices.has(i) ? ("counting" as const) : ("not_counting_low" as const),
    })),
    ...outsideWindow.map((r) => ({ roundId: r.id, status: "not_counting_old" as const })),
  ];
}

const LOW_COUNT_TABLE: Record<number, { use: number; adjustment: number }> = {
  3: { use: 1, adjustment: -2.0 },
  4: { use: 1, adjustment: -1.0 },
  5: { use: 1, adjustment: 0 },
  6: { use: 2, adjustment: -1.0 },
  7: { use: 2, adjustment: 0 },
  8: { use: 2, adjustment: 0 },
  9: { use: 3, adjustment: 0 },
  10: { use: 3, adjustment: 0 },
  11: { use: 3, adjustment: 0 },
  12: { use: 4, adjustment: 0 },
  13: { use: 4, adjustment: 0 },
  14: { use: 4, adjustment: 0 },
  15: { use: 5, adjustment: 0 },
  16: { use: 5, adjustment: 0 },
  17: { use: 6, adjustment: 0 },
  18: { use: 6, adjustment: 0 },
  19: { use: 7, adjustment: 0 },
};

export interface HandicapIndexResult {
  handicapIndex: number | null;
  scoresUsed: number;
  differentialsConsidered: number;
  message?: string;
}

export function calculateHandicapIndex(
  differentials: number[]
): HandicapIndexResult {
  const n = differentials.length;

  if (n < 3) {
    return {
      handicapIndex: null,
      scoresUsed: 0,
      differentialsConsidered: n,
      message: `Need at least 3 rounds to establish a Handicap Index (have ${n}).`,
    };
  }

  const record = differentials.slice(0, 20);
  const sorted = [...record].sort((a, b) => a - b);

  if (record.length >= 20) {
    const lowest8 = sorted.slice(0, 8);
    const avg = lowest8.reduce((a, b) => a + b, 0) / 8;
    return {
      handicapIndex: Math.round(avg * 10) / 10,
      scoresUsed: 8,
      differentialsConsidered: record.length,
    };
  }

  const rule = LOW_COUNT_TABLE[record.length];
  const lowest = sorted.slice(0, rule.use);
  const avg = lowest.reduce((a, b) => a + b, 0) / rule.use;
  const adjusted = avg + rule.adjustment;

  return {
    handicapIndex: Math.round(adjusted * 10) / 10,
    scoresUsed: rule.use,
    differentialsConsidered: record.length,
  };
}

export const MAX_HANDICAP_INDEX = 54.0;

export function clampHandicapIndex(index: number): number {
  return Math.min(index, MAX_HANDICAP_INDEX);
}

/* 9-hole Course Handicap calculation */

export interface NineHoleCourseHandicapInput {
  handicapIndex: number | null;
  nineSlopeRating: number;
  nineCourseRating: number;
  ninePar: number;
}

export function calculateNineHoleCourseHandicap({
  handicapIndex,
  nineSlopeRating,
  nineCourseRating,
  ninePar,
}: NineHoleCourseHandicapInput): number {
  return calculateCourseHandicap({
    handicapIndex: handicapIndex === null ? null : handicapIndex / 2,
    slopeRating: nineSlopeRating,
    courseRating: nineCourseRating,
    par: ninePar,
  });
}


export function expectedNineHoleDifferential(handicapIndex: number): number {
  return 0.52 * handicapIndex + 1.2;
}

/* Converts a 9-hole Score Differential into the 18-hole */

export function combinedEighteenHoleDifferential(
  nineHoleDifferential: number,
  handicapIndex: number | null
): number {
  if (handicapIndex === null) return nineHoleDifferential;
  const expected = expectedNineHoleDifferential(handicapIndex);
  return Math.round((nineHoleDifferential + expected) * 10) / 10;
}
