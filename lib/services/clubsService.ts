import { SupabaseClient } from "@supabase/supabase-js";
import type { ClubDistance, NewClubDistanceInput } from "@/lib/types";

export async function listClubDistances(
  supabase: SupabaseClient,
  userId: string
): Promise<ClubDistance[]> {
  const { data, error } = await supabase
    .from("club_distances")
    .select("*")
    .eq("user_id", userId)
    .order("typical_distance_meters", { ascending: false });

  if (error) throw error;
  return data as ClubDistance[];
}

/* Adds a club or updates its distance only if already has one by that name. */
export async function upsertClubDistance(
  supabase: SupabaseClient,
  userId: string,
  input: NewClubDistanceInput
) {
  const { error } = await supabase.from("club_distances").upsert(
    {
      user_id: userId,
      club_name: input.clubName,
      typical_distance_meters: input.typicalDistanceMeters,
    },
    { onConflict: "user_id,club_name" }
  );
  if (error) throw error;
}

export async function deleteClubDistance(supabase: SupabaseClient, clubId: string) {
  const { error } = await supabase.from("club_distances").delete().eq("id", clubId);
  if (error) throw error;
}
