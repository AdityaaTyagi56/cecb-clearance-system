import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  sector: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const template = await prisma.masterTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(template);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const template = await prisma.masterTemplate.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(template);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.masterTemplate.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
