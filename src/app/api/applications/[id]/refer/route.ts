// api/applications/[id]/refer/route.ts
// POST: UNDER_SCRUTINY -> REFERRED (SCRUTINY only)
// Auto-triggers generateMeetingGist() which then sets status to MOM_GENERATED

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTransition, canRoleTransition } from "@/lib/workflow";
import { generateMeetingGist } from "@/lib/gist-generator";
import { createAuditLog } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SCRUTINY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { documents: true, deficiencyNotes: { where: { isResolved: false } } },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (application.deficiencyNotes.length > 0) {
    return NextResponse.json({ error: "All deficiency notes must be resolved before referring" }, { status: 400 });
  }

  const allVerified = application.documents.every((d) => d.isVerified);
  if (!allVerified) {
    return NextResponse.json({ error: "All documents must be verified before referring" }, { status: 400 });
  }

  if (!isValidTransition(application.status, "REFERRED") || !canRoleTransition(session.user.role, application.status, "REFERRED")) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  // Set to REFERRED first, then auto-generate gist (which sets MOM_GENERATED)
  await prisma.application.update({
    where: { id: params.id },
    data: { status: "REFERRED" },
  });

  await createAuditLog({
    applicationId: params.id,
    performedById: session.user.id,
    action: "STATUS_CHANGED",
    fromStatus: "UNDER_SCRUTINY",
    toStatus: "REFERRED",
  });

  // Auto-generate Meeting Gist
  const gist = await generateMeetingGist(params.id);

  return NextResponse.json({ application: { ...application, status: "MOM_GENERATED" }, gist });
}
