import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";

export default async function AdminTemplatesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) redirect("/dashboard");

  const templates = await prisma.masterTemplate.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MoM Templates</h1>
        <Link
          href="/admin/templates/new"
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800"
        >
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg border p-10 text-center text-gray-400">
          No templates yet. Create one to auto-generate Meeting Gists.
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-lg border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Sector: {t.sector}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.content.slice(0, 120)}...
                  </p>
                </div>
                <Link
                  href={`/admin/templates/${t.id}`}
                  className="text-sm text-green-700 hover:underline ml-4 shrink-0"
                >
                  Edit →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
