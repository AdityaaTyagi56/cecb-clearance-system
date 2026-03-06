import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, ApplicationStatus } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalApplications,
    statusBreakdown,
    totalUsers,
    userRoleBreakdown,
    pendingPayments,
  ] = await prisma.$transaction([
    prisma.application.count(),
    prisma.application.groupBy({
      by: ["status"],
      orderBy: { status: "asc" },
      _count: true,
    }),
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      orderBy: { role: "asc" },
      _count: true,
    }),
    prisma.application.count({ where: { feePaid: false, status: { not: ApplicationStatus.DRAFT } } }),
  ]);

  return NextResponse.json({
    applications: {
      total: totalApplications,
      byStatus: Object.fromEntries(
        statusBreakdown.map((s) => [s.status, s._count])
      ),
    },
    users: {
      total: totalUsers,
      byRole: Object.fromEntries(
        userRoleBreakdown.map((r) => [r.role, r._count])
      ),
    },
    pendingPayments,
  });
}
