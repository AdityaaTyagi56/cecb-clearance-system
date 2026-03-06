import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { isValidTransition, canRoleTransition } from "@/lib/workflow";
import { ApplicationStatus, Role } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== Role.SCRUTINY && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const from = application.status;
  const to = ApplicationStatus.UNDER_SCRUTINY;

  if (!isValidTransition(from, to) || !canRoleTransition(session.user.role, from, to)) {
    return NextResponse.json({ error: `Cannot transition from ${from} to ${to}` }, { status: 409 });
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status: to },
  });

  await createAuditLog({
    applicationId: params.id,
    performedById: session.user.id,
    action: "STATUS_CHANGED",
    metadata: { from, to },
  });

  return NextResponse.json(updated);
}
