import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Welcome</h2>
      <p>Predict World Cup matches. Compete with friends.</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded bg-field px-4 py-2 text-sm font-medium text-white hover:bg-field/90"
        >
          Log In / Sign Up
        </Link>
        <Link
          href="/dashboard"
          className="rounded border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
