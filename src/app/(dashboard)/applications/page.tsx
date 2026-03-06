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

export default async function ApplicationsQueuePage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; search?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role === Role.PROPONENT) redirect("/applications/mine");

  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 20;
  const statusFilter = searchParams.status as ApplicationStatus | undefined;
  const search = searchParams.search ?? "";

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search
      ? {
          OR: [
            { applicationNumber: { contains: search, mode: "insensitive" as const } },
            { projectName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [applications, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { proponent: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.application.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Application Queue</h1>
        <span className="text-sm text-gray-500">{total} total applications</span>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 mb-6 flex-wrap">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by number or project name..."
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Application No.</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Project Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sector</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proponent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No applications found
                </td>
              </tr>
            )}
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{app.applicationNumber}</td>
                <td className="px-4 py-3 font-medium">{app.projectName}</td>
                <td className="px-4 py-3 text-gray-600">{app.sector}</td>
                <td className="px-4 py-3 text-gray-600">{app.proponent.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}
                  >
                    {STATUS_LABELS[app.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(app.updatedAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/applications/${app.id}`}
                    className="text-green-700 hover:underline text-xs font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}&status=${statusFilter ?? ""}&search=${search}`}
                className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}&status=${statusFilter ?? ""}&search=${search}`}
                className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
