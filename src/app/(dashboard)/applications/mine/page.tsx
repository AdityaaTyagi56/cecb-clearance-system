import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role, ApplicationStatus } from "@prisma/client";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_SCRUTINY: "Under Scrutiny",
  ESSENTIAL_DOC_SOUGHT: "Deficiency Raised",
  REFERRED: "Referred to MoM",
  MOM_GENERATED: "MoM Generated",
  FINALIZED: "Finalized",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_SCRUTINY: "bg-yellow-100 text-yellow-700",
  ESSENTIAL_DOC_SOUGHT: "bg-red-100 text-red-700",
  REFERRED: "bg-purple-100 text-purple-700",
  MOM_GENERATED: "bg-indigo-100 text-indigo-700",
  FINALIZED: "bg-green-100 text-green-700",
};

export default async function MyApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== Role.PROPONENT) redirect("/applications");

  const applications = await prisma.application.findMany({
    where: { proponentId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <Link
          href="/applications/new"
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 font-medium"
        >
          + New Application
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg border p-10 text-center">
          <p className="text-gray-500 mb-4">No applications yet.</p>
          <Link
            href="/applications/new"
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-green-800 inline-block"
          >
            Start a New Application
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-lg border p-5 flex items-start justify-between hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {app.applicationNumber}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}
                  >
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mt-1">{app.projectName}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {app.sector} · {app.category}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Updated {new Date(app.updatedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {app.status === ApplicationStatus.DRAFT && (
                  <Link
                    href={`/applications/${app.id}/edit`}
                    className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                )}
                <Link
                  href={`/applications/${app.id}`}
                  className="text-sm bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
