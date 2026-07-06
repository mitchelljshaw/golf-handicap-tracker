import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseWithHoles } from "@/lib/services/coursesService";
import { listClubDistances } from "@/lib/services/clubsService";
import { Navbar } from "@/components/Navbar";
import { CourseGuide } from "@/components/CourseGuide";

export default async function CourseGuidePage({ // Course Guide Page
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const course = await getCourseWithHoles(supabase, id);
  if (!course) notFound();

  const clubDistances = await listClubDistances(supabase, user!.id);
  const clubs = clubDistances.map((c) => ({
    clubName: c.club_name,
    distanceMeters: c.typical_distance_meters,
  }));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl text-ink">
          {course.name}
        </h1>
        {course.location && <p className="mb-6 text-sm text-pencil">{course.location}</p>}
        <CourseGuide course={course} clubs={clubs} />
      </main>
    </>
  );
}
