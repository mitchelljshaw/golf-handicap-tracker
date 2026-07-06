import { createClient } from "@/lib/supabase/server";
import { listClubDistances } from "@/lib/services/clubsService";
import { Navbar } from "@/components/Navbar";
import { ClubBagForm } from "@/components/ClubBagForm";

export default async function ClubsPage() { // Clubs Page
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const clubs = await listClubDistances(supabase, user!.id);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl text-ink">My bag</h1>
        <p className="mb-6 text-sm text-pencil">
          Set your typical distance per club to get a suggested club for each hole when logging a
          round.
        </p>
        <ClubBagForm clubs={clubs} />
      </main>
    </>
  );
}
