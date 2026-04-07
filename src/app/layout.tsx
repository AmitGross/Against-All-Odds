import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import NavBar from "@/components/nav-bar";
import CountdownBanner from "@/components/countdown-banner";
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
        <header className="relative border-b border-ink/10">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold">
              World Cup Predictor
            </Link>
            <Suspense fallback={<div className="w-8 h-8" />}>
              <NavBar />
            </Suspense>
          </div>
        </header>
        <Suspense fallback={null}>
          <CountdownBanner />
        </Suspense>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
