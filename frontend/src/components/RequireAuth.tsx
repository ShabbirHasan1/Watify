"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// TKT-0029: client-side route guard. The spec prefers a server-side
// route-group with cookie-aware redirect; the client guard is the
// approved interim ship. Each authed page wraps its body in this.
//
// Why useEffect for the redirect: calling router.replace during
// render triggers a "set state during render" warning in React.
// We render the skeleton on the not-authed branch so the page body
// never flashes; the effect fires the redirect on the next tick.
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading || !user) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
