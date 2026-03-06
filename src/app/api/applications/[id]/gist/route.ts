// api/applications/[id]/gist/route.ts
// GET: fetch meeting gist (MOM_TEAM, ADMIN)
// PATCH: save edited content (MOM_TEAM, only if not locked)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["MOM_TEAM", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const gist = await prisma.meetingGist.findUnique({
    where: { applicationId: params.id },
  });

  if (!gist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ gist });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "MOM_TEAM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const gist = await prisma.meetingGist.findUnique({
    where: { applicationId: params.id },
  });

  if (!gist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (gist.isLocked) {
    return NextResponse.json({ error: "This MoM is locked and cannot be edited" }, { status: 409 });
  }

  const { editedContent } = await request.json();

  const updated = await prisma.meetingGist.update({
    where: { applicationId: params.id },
    data: { editedContent },
  });

  return NextResponse.json({ gist: updated });
}
