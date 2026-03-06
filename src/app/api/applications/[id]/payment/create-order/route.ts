// api/applications/[id]/payment/create-order/route.ts
// POST: Create Razorpay order (PROPONENT only)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PROPONENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (application.proponentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (application.feePaid) {
    return NextResponse.json({ error: "Payment already completed" }, { status: 400 });
  }

  // Get fee from SectorParameter
  const feeParam = await prisma.sectorParameter.findUnique({
    where: { sector_paramKey: { sector: application.sector, paramKey: "application_fee" } },
  });

  const amountInPaise = Math.round((feeParam ? Number(feeParam.paramValue) : 10000) * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: application.applicationNumber,
  });

  await prisma.application.update({
    where: { id: params.id },
    data: { feeAmount: amountInPaise / 100, paymentOrderId: order.id },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  });
}
