import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { ApplicationStatus, Role } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  note: z.string().min(10).max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== Role.SCRUTINY && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (application.status !== ApplicationStatus.UNDER_SCRUTINY) {
    return NextResponse.json({ error: "Application must be UNDER_SCRUTINY to raise deficiency" }, { status: 409 });
  }

  const [deficiency] = await prisma.$transaction([
    prisma.deficiencyNote.create({
      data: {
        applicationId: params.id,
        noteText: parsed.data.note,
        raisedById: session.user.id,
      },
    }),
    prisma.application.update({
      where: { id: params.id },
      data: { status: ApplicationStatus.ESSENTIAL_DOC_SOUGHT },
    }),
  ]);

  await createAuditLog({
    applicationId: params.id,
    performedById: session.user.id,
    action: "DEFICIENCY_RAISED",
    metadata: { note: parsed.data.note },
  });

  return NextResponse.json(deficiency, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deficiencies = await prisma.deficiencyNote.findMany({
    where: { applicationId: params.id },
    orderBy: { createdAt: "desc" },
    include: { raisedBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json(deficiencies);
}
