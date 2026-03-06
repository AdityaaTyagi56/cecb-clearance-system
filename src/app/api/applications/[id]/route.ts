// api/applications/[id]/route.ts
// GET: fetch application by id (scoped by role)
// PATCH: update application fields (PROPONENT, DRAFT status only)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      proponent: { select: { id: true, name: true, email: true } },
      documents: true,
      deficiencyNotes: true,
      meetingGist: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Proponents can only view their own applications
  if (
    session.user.role === "PROPONENT" &&
    application.proponentId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ application });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PROPONENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (application.proponentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (application.status !== "DRAFT") {
    return NextResponse.json({ error: "Can only edit DRAFT applications" }, { status: 400 });
  }

  const body = await request.json();

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json({ application: updated });
}
