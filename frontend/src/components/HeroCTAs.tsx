"use client";

// TKT-0046: client-side CTA pair on the hero. Hides "Get started"
// once /api/health.registered === true so the operator does not
// click into a 409 register page after the admin is set up.

import Link from "next/link";
import { useHealth } from "@/hooks/useHealth";

export default function HeroCTAs() {
  const { health } = useHealth();
  const registered = health?.registered === true;
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/login"
        className="rounded bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-5 py-2.5 text-sm font-medium"
      >
        Sign in
      </Link>
      {!registered ? (
        <Link
          href="/register"
          className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          Get started
        </Link>
      ) : null}
    </div>
  );
}
