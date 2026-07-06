/* Club recommendation heuristic using typical distances for golf clubs. Average.*/

export interface ClubDistanceInput {
  clubName: string;
  distanceMeters: number;
}

export interface HoleRecommendation {
  teeClub: string;
  teeReason: string;
  approachClub: string | null;
  approachReason: string | null;
}

const DRIVABLE_MARGIN_METERS = 20;

function closestClub(clubs: ClubDistanceInput[], targetDistance: number): ClubDistanceInput {
  return clubs.reduce((best, club) =>
    Math.abs(club.distanceMeters - targetDistance) < Math.abs(best.distanceMeters - targetDistance)
      ? club
      : best
  );
}

function closestClubPreferringLonger(
  clubs: ClubDistanceInput[],
  targetDistance: number
): ClubDistanceInput {
  return clubs.reduce((best, club) => {
    const diff = Math.abs(club.distanceMeters - targetDistance);
    const bestDiff = Math.abs(best.distanceMeters - targetDistance);
    if (diff < bestDiff) return club;
    if (diff === bestDiff) return club.distanceMeters > best.distanceMeters ? club : best;
    return best;
  });
}

export function recommendClubsForHole(
  yardageMeters: number | null,
  par: number,
  clubs: ClubDistanceInput[]
): HoleRecommendation | null {
  if (!yardageMeters || clubs.length === 0) return null;

  const sorted = [...clubs].sort((a, b) => b.distanceMeters - a.distanceMeters);
  const longest = sorted[0];

  if (par === 3) {
    const club = closestClubPreferringLonger(clubs, yardageMeters);
    return {
      teeClub: club.clubName,
      teeReason: `Closest match for a ${yardageMeters}m hole`,
      approachClub: null,
      approachReason: null,
    };
  }

  const drivable = yardageMeters <= longest.distanceMeters + DRIVABLE_MARGIN_METERS;
  const useSecondLongest = drivable && sorted.length > 1;
  const teeClub = useSecondLongest ? sorted[1] : longest;

  const teeReason = useSecondLongest
    ? `Short enough that ${longest.clubName} could run through — ${teeClub.clubName} for position`
    : `Your longest club, to maximise distance off the tee`;

  const remaining = Math.max(yardageMeters - teeClub.distanceMeters, 0);
  const approach = closestClub(clubs, remaining);

  return {
    teeClub: teeClub.clubName,
    teeReason,
    approachClub: approach.clubName,
    approachReason: `~${remaining}m left for your approach`,
  };
}
