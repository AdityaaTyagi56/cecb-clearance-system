"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role, ApplicationStatus } from "@prisma/client";

interface Props {
  applicationId: string;
  status: ApplicationStatus;
  feePaid: boolean;
  userRole: Role;
  userId: string;
  proponentId: string;
  hasGist: boolean;
}

export default function ApplicationActions({
  applicationId,
  status,
  feePaid,
  userRole,
  userId,
  proponentId,
  hasGist,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const call = async (endpoint: string, label: string) => {
    setLoading(label);
    setError("");
    try {
      const res = await fetch(`/api/applications/${applicationId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Action failed");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const isProponentOwner = userRole === Role.PROPONENT && userId === proponentId;
  const isScrutiny = userRole === Role.SCRUTINY || userRole === Role.ADMIN;
  const isMomTeam = userRole === Role.MOM_TEAM || userRole === Role.ADMIN;

  return (
    <div>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {/* Proponent: Submit */}
        {isProponentOwner && status === ApplicationStatus.DRAFT && feePaid && (
          <button
            onClick={() => call("submit", "submit")}
            disabled={loading === "submit"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading === "submit" ? "Submitting..." : "Submit Application"}
          </button>
        )}

        {/* Proponent: Resubmit after deficiency */}
        {isProponentOwner && status === ApplicationStatus.ESSENTIAL_DOC_SOUGHT && (
          <button
            onClick={() => call("resubmit", "resubmit")}
            disabled={loading === "resubmit"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading === "resubmit" ? "Submitting..." : "Resubmit Application"}
          </button>
        )}

        {/* Scrutiny: Start Scrutiny */}
        {isScrutiny && status === ApplicationStatus.SUBMITTED && (
          <button
            onClick={() => call("start-scrutiny", "start-scrutiny")}
            disabled={loading === "start-scrutiny"}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 disabled:opacity-60"
          >
            {loading === "start-scrutiny" ? "Processing..." : "Start Scrutiny"}
          </button>
        )}

        {/* Scrutiny: Raise Deficiency — links to deficiency form */}
        {isScrutiny && status === ApplicationStatus.UNDER_SCRUTINY && (
          <a
            href={`/applications/${applicationId}/documents`}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 inline-block"
          >
            Raise Deficiency
          </a>
        )}

        {/* Scrutiny: Refer to MoM */}
        {isScrutiny && status === ApplicationStatus.UNDER_SCRUTINY && (
          <button
            onClick={() => call("refer", "refer")}
            disabled={loading === "refer"}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60"
          >
            {loading === "refer" ? "Referring..." : "Refer to Meeting"}
          </button>
        )}

        {/* MoM Team: Finalize Gist */}
        {isMomTeam && status === ApplicationStatus.MOM_GENERATED && hasGist && (
          <button
            onClick={() => call("gist/finalize", "finalize")}
            disabled={loading === "finalize"}
            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-60"
          >
            {loading === "finalize" ? "Finalizing..." : "Finalize MoM"}
          </button>
        )}
      </div>
    </div>
  );
}
