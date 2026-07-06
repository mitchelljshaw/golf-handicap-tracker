import { SupabaseClient } from "@supabase/supabase-js";
import type { NewRoundInput, Round, RoundWithDetails } from "@/lib/types";
import {
  adjustedGrossScore,
  calculateCourseHandicap,
  calculateHandicapIndex,
  calculateNineHoleCourseHandicap,
  combinedEighteenHoleDifferential,
  isExceptionalScore,
  netDoubleBogeyCap,
  scoreDifferential,
  type HoleInfo,
} from "@/lib/whs";
import { getTeeSetWithHoles } from "@/lib/services/coursesService";

/* Current Handicap Index from their scoring record.*/
export async function getCurrentHandicapIndex(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("rounds")
    .select("score_differential, date_played, created_at")
    .eq("user_id", userId)
    .order("date_played", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const differentials = (data ?? []).map((r) => Number(r.score_differential));
  return calculateHandicapIndex(differentials);
}

export async function listRounds(
  supabase: SupabaseClient,
  userId: string
): Promise<(Round & { tee_set: { name: string; course: { id: string; name: string } } })[]> {
  const { data, error } = await supabase
    .from("rounds")
    .select("*, tee_set:tee_sets(name, course:courses(id, name))")
    .eq("user_id", userId)
    .order("date_played", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as (Round & { tee_set: { name: string; course: { id: string; name: string } } })[];
}

export async function getRound(
  supabase: SupabaseClient,
  roundId: string
): Promise<RoundWithDetails | null> {
  const { data, error } = await supabase
    .from("rounds")
    .select("*, round_holes(*), tee_set:tee_sets(*, course:courses(*))")
    .eq("id", roundId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    round_holes: (data.round_holes as RoundWithDetails["round_holes"]).sort(
      (a, b) => a.hole_number - b.hole_number
    ),
  };
}

/* Looks up the tee set's holes, checks Handicap Index, adjusts for 9-hole round */
export async function createRound(
  supabase: SupabaseClient,
  userId: string,
  input: NewRoundInput
): Promise<string> {
  const teeSet = await getTeeSetWithHoles(supabase, input.teeSetId);
  if (!teeSet) throw new Error("Tee set not found");

  const allHoles: HoleInfo[] = teeSet.holes.map((h) => ({
    holeNumber: h.hole_number,
    par: h.par,
    strokeIndex: h.stroke_index,
  }));

  const current = await getCurrentHandicapIndex(supabase, userId);
  const handicapEstablished = current.handicapIndex !== null;

  const isNineHoleRound = input.holesPlayed === 9;

  let holes: HoleInfo[];
  let courseHandicap: number;
  let effectiveCourseRating: number;
  let effectiveSlopeRating: number;

  if (isNineHoleRound) {
    if (input.ninePlayed === null) throw new Error("ninePlayed is required for a 9-hole round");

    const isFront = input.ninePlayed === "front";
    holes = allHoles.filter((h) => (isFront ? h.holeNumber <= 9 : h.holeNumber > 9));

    const nineCourseRating = isFront ? teeSet.front_course_rating : teeSet.back_course_rating;
    const nineSlopeRating = isFront ? teeSet.front_slope_rating : teeSet.back_slope_rating;
    if (nineCourseRating === null || nineSlopeRating === null) {
      throw new Error(
        `This tee doesn't have an official ${isFront ? "front" : "back"}-nine Course Rating/Slope Rating on file yet.`
      );
    }
    effectiveCourseRating = nineCourseRating;
    effectiveSlopeRating = nineSlopeRating;

    const ninePar = holes.reduce((sum, h) => sum + h.par, 0);
    courseHandicap = calculateNineHoleCourseHandicap({
      handicapIndex: current.handicapIndex,
      nineSlopeRating: effectiveSlopeRating,
      nineCourseRating: effectiveCourseRating,
      ninePar,
    });
  } else {
    holes = allHoles;
    effectiveCourseRating = teeSet.course_rating;
    effectiveSlopeRating = teeSet.slope_rating;
    courseHandicap = calculateCourseHandicap({
      handicapIndex: current.handicapIndex,
      slopeRating: effectiveSlopeRating,
      courseRating: effectiveCourseRating,
      par: teeSet.par,
    });
  }

  const ags = adjustedGrossScore(
    holes,
    input.holeScores.map((h) => ({ holeNumber: h.holeNumber, grossScore: h.grossScore })),
    courseHandicap,
    handicapEstablished
  );

  const rawDifferential = scoreDifferential(ags, effectiveCourseRating, effectiveSlopeRating);
  const differential = isNineHoleRound
    ? combinedEighteenHoleDifferential(rawDifferential, current.handicapIndex)
    : rawDifferential;

  const totalGross = input.holeScores.reduce((sum, h) => sum + h.grossScore, 0);
  const exceptional = isExceptionalScore(differential, current.handicapIndex);

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .insert({
      user_id: userId,
      tee_set_id: input.teeSetId,
      date_played: input.datePlayed,
      handicap_index_at_time: current.handicapIndex,
      course_handicap: courseHandicap,
      total_gross_score: totalGross,
      adjusted_gross_score: ags,
      score_differential: differential,
      raw_nine_hole_differential: isNineHoleRound ? rawDifferential : null,
      holes_played: input.holesPlayed,
      nine_played: isNineHoleRound ? input.ninePlayed : null,
      is_exceptional: exceptional,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (roundError) throw roundError;

  const roundHoleRows = input.holeScores.map((score) => {
    const hole = holes.find((h) => h.holeNumber === score.holeNumber)!;
    const cap = netDoubleBogeyCap(hole, courseHandicap, handicapEstablished);
    return {
      round_id: round.id,
      hole_number: score.holeNumber,
      par: hole.par,
      gross_score: score.grossScore,
      net_double_bogey_cap: cap,
      adjusted_score: Math.min(score.grossScore, cap),
      putts: score.putts,
    };
  });

  const { error: holesError } = await supabase.from("round_holes").insert(roundHoleRows);
  if (holesError) throw holesError;

  return round.id as string;
}

export async function deleteRound(supabase: SupabaseClient, roundId: string) {
  const { error } = await supabase.from("rounds").delete().eq("id", roundId);
  if (error) throw error;
}
