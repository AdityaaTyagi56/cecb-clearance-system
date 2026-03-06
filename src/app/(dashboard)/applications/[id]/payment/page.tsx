import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import PaymentWidget from "./PaymentWidget";

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      proponent: { select: { name: true, email: true } },
    },
  });

  if (!app) notFound();

  if (session.user.role === Role.PROPONENT && app.proponentId !== session.user.id) {
    redirect("/applications/mine");
  }

  const sectorParam = await prisma.sectorParameter.findUnique({
    where: { sector_paramKey: { sector: app.sector, paramKey: "application_fee" } },
  });

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Payment</h1>
      <p className="text-sm text-gray-500 mb-6">{app.applicationNumber} · {app.projectName}</p>

      <PaymentWidget
        applicationId={app.id}
        status={app.status}
        feePaid={app.feePaid}
        razorpayOrderId={app.paymentOrderId}
        razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? ""}
        feeAmount={sectorParam ? Number(sectorParam.paramValue) * 100 : null}
        projectName={app.projectName}
        userEmail={app.proponent.email}
        userName={app.proponent.name}
      />
    </div>
  );
}
