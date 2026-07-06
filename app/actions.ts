"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRound, deleteRound } from "@/lib/services/roundsService";
import { createCourse, updateHoleYardage } from "@/lib/services/coursesService";
import { deleteClubDistance, upsertClubDistance } from "@/lib/services/clubsService";
import type { NewClubDistanceInput, NewCourseInput, NewRoundInput } from "@/lib/types";

export async function signIn(formData: FormData) { // User signin with email/password
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?message=${encodeURIComponent("Check your email to confirm your account.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCourseAction(input: NewCourseInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const courseId = await createCourse(supabase, user.id, input);
  revalidatePath("/courses");
  redirect(`/courses`);
  return courseId;
}

export async function createRoundAction(input: NewRoundInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const roundId = await createRound(supabase, user.id, input);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect(`/rounds/${roundId}`);
}

export async function deleteRoundAction(roundId: string) {
  const supabase = await createClient();
  await deleteRound(supabase, roundId);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect("/rounds");
}

export async function addClubDistanceAction(input: NewClubDistanceInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  await upsertClubDistance(supabase, user.id, input);
  revalidatePath("/clubs");
  revalidatePath("/rounds/new");
}

export async function deleteClubDistanceAction(clubId: string) {
  const supabase = await createClient();
  await deleteClubDistance(supabase, clubId);
  revalidatePath("/clubs");
  revalidatePath("/rounds/new");
}

export async function updateHoleYardageAction(holeId: string, yardageMeters: number | null) {
  const supabase = await createClient();
  await updateHoleYardage(supabase, holeId, yardageMeters);
  revalidatePath("/courses");
  revalidatePath("/rounds/new");
}
