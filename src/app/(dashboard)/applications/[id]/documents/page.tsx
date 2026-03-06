// src/app/(dashboard)/applications/[id]/documents/page.tsx — Document upload & management

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";

type DocumentType =
  | "EC_FORM"
  | "NOC"
  | "LAND_CLEARANCE"
  | "ENVIRONMENTAL_IMPACT_ASSESSMENT"
  | "PUBLIC_HEARING_RECORD"
  | "FOREST_CLEARANCE"
  | "CONSENT_TO_ESTABLISH"
  | "OTHER";

type Document = {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: DocumentType;
  fileSize: number | null;
  mimeType: string | null;
  isVerified: boolean;
  isMandatory: boolean;
  notes: string | null;
  createdAt: string;
};

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  EC_FORM: "EC Form",
  NOC: "NOC",
  LAND_CLEARANCE: "Land Clearance",
  ENVIRONMENTAL_IMPACT_ASSESSMENT: "Environmental Impact Assessment",
  PUBLIC_HEARING_RECORD: "Public Hearing Record",
  FOREST_CLEARANCE: "Forest Clearance",
  CONSENT_TO_ESTABLISH: "Consent to Establish",
  OTHER: "Other",
};

export default function DocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<DocumentType>("EC_FORM");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDocs = async () => {
    const res = await fetch(`/api/applications/${id}/documents`);
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500 text-sm animate-pulse">Loading documents…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">Upload all required environmental clearance documents.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-gray-800">Upload New Document</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">{success}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <UploadDropzone
          endpoint="documentUploader"
          onClientUploadComplete={async (res) => {
            setError("");
            const fileData = res[0];
            if (!fileData) return;
            type UTFile = { ufsUrl?: string; url?: string; name: string; size: number };
            const f = fileData as UTFile;
            try {
              const dbRes = await fetch(`/api/applications/${id}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileName: f.name,
                  fileUrl: f.ufsUrl ?? f.url,
                  documentType: docType,
                  fileSize: f.size,
                  mimeType: "application/octet-stream",
                }),
              });
              if (!dbRes.ok) {
                const err = await dbRes.json();
                setError(err.error ?? "Failed to save document record");
                return;
              }
              setSuccess(`"${f.name}" uploaded successfully.`);
              fetchDocs();
            } catch {
              setError("Failed to register document in database.");
            }
          }}
          onUploadError={(err) => setError(err.message)}
          className="ut-label:text-green-700 ut-button:bg-green-600 ut-button:hover:bg-green-700 ut-allowed-content:text-gray-400"
        />
      </div>

      {/* Document List */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800">Uploaded Documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {DOC_TYPE_LABELS[doc.documentType]}
                  {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                {doc.isVerified
                  ? <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified</span>
                  : <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>
                }
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                  View
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

