import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role, ApplicationStatus } from "@prisma/client";
import AuditTimeline from "./AuditTimeline";

export default async function AuditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const [app, logs] = await Promise.all([
    prisma.application.findUnique({
      where: { id: params.id },
      select: { id: true, applicationNumber: true, projectName: true, proponentId: true },
    }),
    prisma.auditLog.findMany({
      where: { applicationId: params.id },
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!app) notFound();
  if (session.user.role === Role.PROPONENT && app.proponentId !== session.user.id) {
    redirect("/applications/mine");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Audit Trail</h1>
      <p className="text-sm text-gray-500 mb-6">{app.applicationNumber} · {app.projectName}</p>
      <AuditTimeline logs={logs} />
    </div>
  );
}
