import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { DocumentType, Role } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.nativeEnum(DocumentType),
  fileKey: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

const verifySchema = z.object({
  documentId: z.string().cuid(),
  verified: z.boolean(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    where: { applicationId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(documents);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (application.proponentId !== session.user.id && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const doc = await prisma.document.create({
    data: {
      applicationId: params.id,
      uploadedById: session.user.id,
      ...parsed.data,
    },
  });

  await createAuditLog({
    applicationId: params.id,
    actorId: session.user.id,
    action: "DOCUMENT_UPLOADED",
    meta: { documentId: doc.id, name: doc.name, type: doc.type },
  });

  return NextResponse.json(doc, { status: 201 });
}

// PATCH: verify or reject a document (SCRUTINY/ADMIN)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== Role.SCRUTINY && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const doc = await prisma.document.update({
    where: { id: parsed.data.documentId },
    data: { isVerified: parsed.data.verified },
  });

  await createAuditLog({
    applicationId: params.id,
    actorId: session.user.id,
    action: parsed.data.verified ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
    meta: { documentId: doc.id },
  });

  return NextResponse.json(doc);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (application?.proponentId !== session.user.id && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.document.delete({ where: { id: documentId } });

  await createAuditLog({
    applicationId: params.id,
    actorId: session.user.id,
    action: "DOCUMENT_DELETED",
    meta: { documentId },
  });

  return new NextResponse(null, { status: 204 });
}
