import { SupabaseClient } from "@supabase/supabase-js";
import type { Course, CourseWithTeeSets, NewCourseInput, TeeSetWithHoles } from "@/lib/types";

export async function listCourses(supabase: SupabaseClient): Promise<CourseWithTeeSets[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*, tee_sets(*)")
    .order("name", { ascending: true });

  if (error) throw error;
  return data as CourseWithTeeSets[];
}

/** Hole data for "log a round" tee selector */
export async function listCoursesWithHoles(
  supabase: SupabaseClient
): Promise<(Course & { tee_sets: TeeSetWithHoles[] })[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*, tee_sets(*, holes(*))")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data as (Course & { tee_sets: TeeSetWithHoles[] })[]).map((course) => ({
    ...course,
    tee_sets: course.tee_sets.map((tee) => ({
      ...tee,
      holes: [...tee.holes].sort((a, b) => a.hole_number - b.hole_number),
    })),
  }));
}

export async function getCourseWithHoles(
  supabase: SupabaseClient,
  courseId: string
): Promise<(Course & { tee_sets: TeeSetWithHoles[] }) | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("*, tee_sets(*, holes(*))")
    .eq("id", courseId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    tee_sets: (data.tee_sets as TeeSetWithHoles[]).map((tee) => ({
      ...tee,
      holes: [...tee.holes].sort((a, b) => a.hole_number - b.hole_number),
    })),
  };
}

export async function getTeeSetWithHoles(
  supabase: SupabaseClient,
  teeSetId: string
): Promise<(TeeSetWithHoles & { course: Course }) | null> {
  const { data, error } = await supabase
    .from("tee_sets")
    .select("*, holes(*), course:courses(*)")
    .eq("id", teeSetId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    holes: (data.holes as TeeSetWithHoles["holes"]).sort(
      (a, b) => a.hole_number - b.hole_number
    ),
  };
}

export async function updateHoleYardage(
  supabase: SupabaseClient,
  holeId: string,
  yardageMeters: number | null
) {
  const { error } = await supabase
    .from("holes")
    .update({ yardage_meters: yardageMeters })
    .eq("id", holeId);
  if (error) throw error;
}

export async function createCourse(
  supabase: SupabaseClient,
  userId: string,
  input: NewCourseInput
): Promise<string> {
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({ name: input.name, location: input.location || null, created_by: userId })
    .select()
    .single();

  if (courseError) throw courseError;

  for (const teeSet of input.teeSets) {
    const { data: teeSetRow, error: teeSetError } = await supabase
      .from("tee_sets")
      .insert({
        course_id: course.id,
        name: teeSet.name,
        course_rating: teeSet.courseRating,
        slope_rating: teeSet.slopeRating,
        par: teeSet.par,
        front_course_rating: teeSet.frontCourseRating,
        front_slope_rating: teeSet.frontSlopeRating,
        back_course_rating: teeSet.backCourseRating,
        back_slope_rating: teeSet.backSlopeRating,
      })
      .select()
      .single();

    if (teeSetError) throw teeSetError;

    const holeRows = teeSet.holes.map((hole) => ({
      tee_set_id: teeSetRow.id,
      hole_number: hole.holeNumber,
      par: hole.par,
      stroke_index: hole.strokeIndex,
      yardage_meters: hole.yardageMeters,
    }));

    const { error: holesError } = await supabase.from("holes").insert(holeRows);
    if (holesError) throw holesError;
  }

  return course.id as string;
}
