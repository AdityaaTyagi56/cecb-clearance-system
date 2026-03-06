import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  sector: z.string().min(1),
  paramKey: z.string().min(1).default("application_fee"),
  paramValue: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sectors = await prisma.sectorParameter.findMany({ orderBy: { sector: "asc" } });
  return NextResponse.json(sectors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exists = await prisma.sectorParameter.findUnique({
    where: {
      sector_paramKey: {
        sector: parsed.data.sector,
        paramKey: parsed.data.paramKey,
      },
    },
  });
  if (exists) return NextResponse.json({ error: "Sector already exists" }, { status: 409 });

  const param = await prisma.sectorParameter.create({ data: parsed.data });
  return NextResponse.json(param, { status: 201 });
}
