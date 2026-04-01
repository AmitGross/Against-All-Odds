import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import NavBar from "@/components/nav-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Predictor",
  description: "Predict World Cup matches and compete with friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <Link href="/" className="text-lg font-bold">
            World Cup Predictor
          </Link>
          <Suspense fallback={<nav className="flex items-center gap-4 text-sm"><span className="text-ink/30">Loading…</span></nav>}>
            <NavBar />
          </Suspense>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
