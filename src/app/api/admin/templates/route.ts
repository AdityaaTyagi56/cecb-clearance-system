import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  sector: z.string().min(1),
  content: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await prisma.masterTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const template = await prisma.masterTemplate.create({
    data: {
      name: parsed.data.name,
      sector: parsed.data.sector,
      content: parsed.data.content,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
