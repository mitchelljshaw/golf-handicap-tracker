import { Navbar } from "@/components/Navbar";
import { CourseForm } from "@/components/CourseForm";

export default function NewCoursePage() { // New Course Page
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <CourseForm />
      </main>
    </>
  );
}
