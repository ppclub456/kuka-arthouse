import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
] as const;

export function AdminNav() {
  return (
    <nav
      aria-label="Admin"
      className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600"
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-sm px-3 py-1.5 text-zinc-800 ring-1 ring-zinc-200/80 transition hover:bg-white hover:ring-sky-400/40"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
