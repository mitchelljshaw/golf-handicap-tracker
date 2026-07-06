import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export async function Navbar() { // Shows links to dashboard, rounds, courses, and my bag 
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-fairway bg-fairway text-paper-raised">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-tight">
          Des Golf Tracker
        </Link>
        {user && (
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-fairway-pale">
              Dashboard
            </Link>
            <Link href="/rounds" className="hover:text-fairway-pale">
              Rounds
            </Link>
            <Link href="/courses" className="hover:text-fairway-pale">
              Courses
            </Link>
            <Link href="/clubs" className="hover:text-fairway-pale">
              My Bag
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-fairway-pale hover:text-paper-raised">
                Sign out
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
