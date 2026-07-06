import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCourses } from "@/lib/services/coursesService";
import { Navbar } from "@/components/Navbar";
import { LinkButton } from "@/components/ui/Button";

export default async function CoursesPage() {
  const supabase = await createClient();
  const courses = await listCourses(supabase);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-ink">Courses</h1>
            <p className="text-sm text-pencil">
              Shared across everyone signed in — add a course once and any golfer can log a
              round on it.
            </p>
          </div>
          <LinkButton href="/courses/new">Add a course</LinkButton>
        </div>

        {courses.length === 0 ? (
          <p className="border border-pencil-pale bg-paper-raised py-12 text-center text-sm text-pencil">
            No courses yet. Add the first one to start logging rounds.
          </p>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="border border-pencil-pale bg-paper-raised p-5">
                <Link
                  href={`/courses/${course.id}`}
                  className="font-[family-name:var(--font-display)] text-lg text-ink hover:underline"
                >
                  {course.name}
                </Link>
                {course.location && <p className="text-sm text-pencil">{course.location}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {course.tee_sets.map((tee) => (
                    <span
                      key={tee.id}
                      className="border border-pencil-pale bg-paper px-3 py-1 font-mono text-xs text-ink"
                    >
                      {tee.name} · CR {Number(tee.course_rating).toFixed(1)} · Slope{" "}
                      {tee.slope_rating} · Par {tee.par}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
