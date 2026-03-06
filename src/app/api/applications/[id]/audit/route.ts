import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.auditLog.findMany({
    where: { applicationId: params.id },
    include: { performedBy: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rows);
}
