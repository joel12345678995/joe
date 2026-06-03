"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto grid max-w-7xl md:grid-cols-[240px_1fr]">
        <aside className="border-r border-border bg-background p-4">
          <h2 className="mb-4 text-xl font-bold">JoeFamily</h2>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
