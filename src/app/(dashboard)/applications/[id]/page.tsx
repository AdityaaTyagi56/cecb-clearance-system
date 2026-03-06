import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Role, ApplicationStatus } from "@prisma/client";
import ApplicationActions from "./ApplicationActions";

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

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      proponent: { select: { name: true, email: true } },
      scrutinyOfficer: { select: { name: true } },
      documents: { orderBy: { createdAt: "asc" } },
      deficiencyNotes: {
        include: { raisedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      meetingGist: true,
    },
  });

  if (!app) notFound();

  // Proponents can only see their own applications
  if (session.user.role === Role.PROPONENT && app.proponentId !== session.user.id) {
    redirect("/applications/mine");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {app.applicationNumber}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}
            >
              {STATUS_LABELS[app.status]}
            </span>
            {app.feePaid && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                Fee Paid ✓
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{app.projectName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {app.sector} · {app.category} · {app.district}
          </p>
        </div>
        <div className="flex gap-2">
          {app.status === ApplicationStatus.DRAFT &&
            session.user.role === Role.PROPONENT && (
              <Link
                href={`/applications/${app.id}/edit`}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Edit
              </Link>
            )}
        </div>
      </div>

      {/* Action buttons (role + status aware) */}
      <ApplicationActions
        applicationId={app.id}
        status={app.status}
        feePaid={app.feePaid}
        userRole={session.user.role}
        userId={session.user.id}
        proponentId={app.proponentId}
        hasGist={!!app.meetingGist}
      />

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 bg-white rounded-lg border p-5 mt-6 text-sm">
        {[
          ["Proponent", app.proponent.name],
          ["Email", app.proponent.email],
          ["Scrutiny Officer", app.scrutinyOfficer?.name ?? "—"],
          ["Investment", app.investmentAmount ? `₹${app.investmentAmount.toLocaleString("en-IN")}` : "—"],
          ["Location", [app.village, app.tahsil, app.district].filter(Boolean).join(", ")],
          ["Survey Numbers", app.surveyNumbers ?? "—"],
          ["Area", app.projectArea ? `${app.projectArea} ha` : "—"],
          ["Created", new Date(app.createdAt).toLocaleDateString("en-IN")],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900 mt-0.5">{String(value)}</dd>
          </div>
        ))}
      </div>

      {/* Proposed Activities */}
      {app.proposedActivities && (
        <div className="bg-white rounded-lg border p-5 mt-4 text-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Proposed Activities</h3>
          <p className="text-gray-700 whitespace-pre-line">{app.proposedActivities}</p>
        </div>
      )}

      {/* Deficiency notes */}
      {app.deficiencyNotes.length > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-5 mt-4">
          <h3 className="font-semibold text-red-800 mb-3">Deficiency Notes</h3>
          <div className="space-y-3">
            {app.deficiencyNotes.map((dn) => (
              <div key={dn.id} className="bg-white rounded border border-red-100 p-3">
                <p className="text-sm text-gray-800">{dn.note}</p>
                <p className="text-xs text-gray-400 mt-1">
                  by {dn.raisedBy.name} on {new Date(dn.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="bg-white rounded-lg border p-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Documents</h3>
          <Link
            href={`/applications/${app.id}/documents`}
            className="text-sm text-green-700 hover:underline"
          >
            Manage Documents →
          </Link>
        </div>
        {app.documents.length === 0 ? (
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {app.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📄</span>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {doc.name}
                  </a>
                  <span className="text-xs text-gray-400">({doc.type})</span>
                </div>
                {doc.isVerified ? (
                  <span className="text-xs text-green-600 font-medium">Verified ✓</span>
                ) : (
                  <span className="text-xs text-amber-600">Pending</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 mt-6 flex-wrap">
        <Link
          href={`/applications/${app.id}/payment`}
          className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Payment
        </Link>
        <Link
          href={`/applications/${app.id}/mom`}
          className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Meeting Gist
        </Link>
        <Link
          href={`/applications/${app.id}/audit`}
          className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Audit Trail
        </Link>
      </div>
    </div>
  );
}
