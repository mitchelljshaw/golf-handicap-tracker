import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCoursesWithHoles } from "@/lib/services/coursesService";
import { getCurrentHandicapIndex } from "@/lib/services/roundsService";
import { listClubDistances } from "@/lib/services/clubsService";
import { Navbar } from "@/components/Navbar";
import { RoundForm } from "@/components/RoundForm";

export default async function NewRoundPage() { // New Round Page 
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [courses, handicap, clubs] = await Promise.all([
    listCoursesWithHoles(supabase),
    getCurrentHandicapIndex(supabase, user!.id),
    listClubDistances(supabase, user!.id),
  ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl text-ink">
          Log a round
        </h1>

        {courses.length === 0 ? (
          <p className="border border-pencil-pale bg-paper-raised py-12 text-center text-sm text-pencil">
            No courses yet.{" "}
            <Link href="/courses/new" className="text-fairway hover:underline">
              Add a course
            </Link>{" "}
            before logging a round.
          </p>
        ) : (
          <RoundForm courses={courses} currentHandicapIndex={handicap.handicapIndex} clubs={clubs} />
        )}
      </main>
    </>
  );
}
