"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";

interface Props {
  applicationId: string;
  status: ApplicationStatus;
  feePaid: boolean;
  razorpayOrderId: string | null;
  razorpayKeyId: string;
  feeAmount: number | null;
  projectName: string;
  userEmail: string;
  userName: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function PaymentWidget({
  applicationId,
  status,
  feePaid,
  razorpayKeyId,
  feeAmount,
  projectName,
  userEmail,
  userName,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (feePaid) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium">
        ✓ Fee payment confirmed
      </div>
    );
  }

  if (status === ApplicationStatus.DRAFT || !feeAmount) {
    return (
      <p className="text-sm text-gray-500">
        Fee details will be calculated based on your sector after the application is created.
      </p>
    );
  }

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/applications/${applicationId}/payment/create-order`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create payment order");
      const { orderId, amount, currency } = await res.json();

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "CECB Environmental Clearance",
        description: projectName,
        order_id: orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch(`/api/applications/${applicationId}/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (!verifyRes.ok) throw new Error("Payment verification failed");
          router.refresh();
        },
        prefill: { name: userName, email: userEmail },
        theme: { color: "#15803d" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="p-5 bg-white rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-2">Application Fee</h3>
        <p className="text-3xl font-bold text-gray-900 mb-1">
          ₹{(feeAmount / 100).toLocaleString("en-IN")}
        </p>
        <p className="text-sm text-gray-500 mb-4">One-time environmental clearance processing fee</p>
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 disabled:opacity-60"
        >
          {loading ? "Opening payment..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
