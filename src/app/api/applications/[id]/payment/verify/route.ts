// api/applications/[id]/payment/verify/route.ts
// POST: Verify Razorpay HMAC signature and mark payment complete

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PROPONENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) {
    return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
  }

  const application = await prisma.application.update({
    where: { id: params.id },
    data: {
      feePaid: true,
      paymentId: razorpay_payment_id,
      paymentDate: new Date(),
    },
  });

  await createAuditLog({
    applicationId: params.id,
    performedById: session.user.id,
    action: "PAYMENT_RECEIVED",
    metadata: { paymentId: razorpay_payment_id },
  });

  return NextResponse.json({ application });
}
