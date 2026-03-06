import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      feePaid: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      status: true,
    },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    feePaid: application.feePaid,
    razorpayOrderId: application.razorpayOrderId,
    razorpayPaymentId: application.razorpayPaymentId,
  });
}
