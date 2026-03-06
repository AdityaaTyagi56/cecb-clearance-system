// api/applications/route.ts
// GET: list all applications (SCRUTINY + ADMIN)
// POST: create a new application (PROPONENT)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApplicationNumber } from "@/lib/application-number";
import { z } from "zod";

const createSchema = z.object({
  projectName: z.string().min(1).max(200),
  projectDescription: z.string().max(2000).optional(),
  sector: z.string().min(1),
  category: z.string().min(1),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "SCRUTINY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const sector = searchParams.get("sector") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: { status: status as never, sector },
      include: { proponent: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where: { status: status as never, sector } }),
  ]);

  return NextResponse.json({ applications, total, page });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PROPONENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", code: parsed.error.message }, { status: 400 });
  }

  const applicationNumber = await generateApplicationNumber();

  const application = await prisma.application.create({
    data: {
      applicationNumber,
      proponentId: session.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}
