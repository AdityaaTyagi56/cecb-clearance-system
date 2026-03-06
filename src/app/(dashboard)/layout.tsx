// app/(dashboard)/layout.tsx — Shared dashboard layout with sidebar

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");

  const role = session.user.role;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "PROPONENT", "SCRUTINY", "MOM_TEAM"] },
    { href: "/applications/new", label: "New Application", roles: ["PROPONENT"] },
    { href: "/applications/mine", label: "My Applications", roles: ["PROPONENT"] },
    { href: "/applications", label: "Application Queue", roles: ["SCRUTINY", "ADMIN"] },
    { href: "/applications", label: "MoM Pending", roles: ["MOM_TEAM"] },
    { href: "/admin/users", label: "User Management", roles: ["ADMIN"] },
    { href: "/admin/templates", label: "MoM Templates", roles: ["ADMIN"] },
  ].filter((l) => l.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-green-800 text-white flex flex-col p-4 gap-2 shrink-0">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-300">CECB PARIVESH 3.0</p>
        </div>
        {navLinks.map((link) => (
          <a
            key={link.href + link.label}
            href={link.href}
            className="px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition"
          >
            {link.label}
          </a>
        ))}
        <div className="mt-auto">
          <p className="text-xs text-green-400 truncate">{session.user.email}</p>
          <p className="text-xs text-green-300">{role}</p>
          <a href="/api/auth/signout" className="mt-2 block text-xs text-green-200 hover:text-white">
            Sign out
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
