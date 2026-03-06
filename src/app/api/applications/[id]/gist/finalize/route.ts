// api/applications/[id]/gist/finalize/route.ts
// POST: Lock the MoM — irreversible (MOM_TEAM only)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTransition, canRoleTransition } from "@/lib/workflow";
import { createAuditLog } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "MOM_TEAM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isValidTransition(application.status, "FINALIZED") || !canRoleTransition(session.user.role, application.status, "FINALIZED")) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  const gist = await prisma.meetingGist.findUnique({ where: { applicationId: params.id } });
  if (!gist) return NextResponse.json({ error: "No gist found for this application" }, { status: 404 });
  if (gist.isLocked) return NextResponse.json({ error: "Already locked" }, { status: 409 });

  const now = new Date();

  const [updatedGist, updatedApp] = await Promise.all([
    prisma.meetingGist.update({
      where: { applicationId: params.id },
      data: { isLocked: true, lockedAt: now, lockedById: session.user.id },
    }),
    prisma.application.update({
      where: { id: params.id },
      data: { status: "FINALIZED" },
    }),
  ]);

  await createAuditLog({
    applicationId: params.id,
    performedById: session.user.id,
    action: "MOM_FINALIZED",
    fromStatus: "MOM_GENERATED",
    toStatus: "FINALIZED",
  });

  return NextResponse.json({ gist: updatedGist, application: updatedApp });
}
