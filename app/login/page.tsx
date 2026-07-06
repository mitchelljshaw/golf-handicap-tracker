import { signIn, signUp } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label } from "@/components/ui/Field";

export default async function LoginPage({ // Login Page
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-fairway">
            Des Golf Tracker
          </h1>
          <p className="mt-1 text-sm text-pencil">
            My digital scorecard for golf!
          </p>
        </div>

        <div className="border border-pencil-pale bg-paper-raised p-6">
          {error && (
            <p className="mb-4 border border-clay bg-paper px-3 py-2 text-sm text-clay">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-4 border border-fairway bg-paper px-3 py-2 text-sm text-fairway">
              {message}
            </p>
          )}

          <form action={signIn}>
            <FieldGroup>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                minLength={6}
              />
            </FieldGroup>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Sign in
              </Button>
              <Button type="submit" formAction={signUp} variant="secondary" className="flex-1">
                Create account
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-pencil">
          Make an account without verification for now. WIP. 
        </p>
      </div>
    </main>
  );
}
