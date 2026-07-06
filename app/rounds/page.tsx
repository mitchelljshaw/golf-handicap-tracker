import { createClient } from "@/lib/supabase/server";
import { listRounds } from "@/lib/services/roundsService";
import { Navbar } from "@/components/Navbar";
import { RoundsList } from "@/components/RoundsList";
import { LinkButton } from "@/components/ui/Button";

export default async function RoundsPage() { // Rounds Page, all rounds logged
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rounds = await listRounds(supabase, user!.id);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-ink">
            All rounds
          </h1>
          <LinkButton href="/rounds/new">Log a round</LinkButton>
        </div>

        {rounds.length === 0 ? (
          <p className="border border-pencil-pale bg-paper-raised py-12 text-center text-sm text-pencil">
            No rounds logged yet.
          </p>
        ) : (
          <RoundsList rounds={rounds} />
        )}
      </main>
    </>
  );
}
