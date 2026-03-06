// app/(dashboard)/dashboard/page.tsx — Role-based dashboard redirect hub

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const role = session.user.role;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Welcome, {session.user.name}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Role: <span className="font-semibold text-green-700">{role}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {role === "PROPONENT" && (
          <>
            <DashCard href="/applications/new" title="New Application" description="Start a new environmental clearance application" />
            <DashCard href="/applications/mine" title="My Applications" description="Track status of your submitted applications" />
          </>
        )}

        {(role === "SCRUTINY" || role === "ADMIN") && (
          <DashCard href="/applications" title="Application Queue" description="Review and process pending applications" />
        )}

        {role === "MOM_TEAM" && (
          <DashCard href="/applications" title="MoM Pending" description="Edit and finalize Minutes of Meeting" />
        )}

        {role === "ADMIN" && (
          <>
            <DashCard href="/admin/users" title="User Management" description="Create users and assign roles" />
            <DashCard href="/admin/templates" title="MoM Templates" description="Manage master templates per sector" />
          </>
        )}
      </div>
    </div>
  );
}

function DashCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      className="block p-5 bg-white border rounded-xl hover:shadow-md hover:border-green-400 transition"
    >
      <h2 className="font-semibold text-gray-800 mb-1">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </a>
  );
}
