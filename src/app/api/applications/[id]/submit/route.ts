// api/applications/[id]/submit/route.ts
// POST: DRAFT -> SUBMITTED (PROPONENT only, payment must be complete)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTransition, canRoleTransition } from "@/lib/workflow";
import { createAuditLog } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (application.proponentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!application.feePaid) {
    return NextResponse.json({ error: "Payment must be completed before submitting" }, { status: 400 });
  }
  if (!isValidTransition(application.status, "SUBMITTED") || !canRoleTransition(session.user.role, application.status, "SUBMITTED")) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  await createAuditLog({
    applicationId: params.id,
    performedById: session.user.id,
    action: "STATUS_CHANGED",
    fromStatus: "DRAFT",
    toStatus: "SUBMITTED",
  });

  return NextResponse.json({ application: updated });
}
