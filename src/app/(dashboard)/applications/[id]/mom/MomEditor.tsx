"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

interface Gist {
  id: string;
  generatedContent: string;
  editedContent: string | null;
  isLocked: boolean;
}

interface Props {
  applicationId: string;
  gist: Gist;
  userRole: Role;
}

export default function MomEditor({ applicationId, gist, userRole }: Props) {
  const router = useRouter();
  const [content, setContent] = useState(gist.editedContent ?? gist.generatedContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canEdit = !gist.isLocked && (userRole === Role.MOM_TEAM || userRole === Role.ADMIN);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/applications/${applicationId}/gist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedContent: content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {gist.isLocked && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          ✓ This MoM has been finalized and locked.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="text-sm text-gray-500">
            {gist.isLocked ? "Locked" : canEdit ? "Editing" : "Read-only"}
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/applications/${applicationId}/gist/export/docx`}
              className="px-3 py-1.5 border rounded text-xs hover:bg-gray-50"
              download
            >
              Export DOCX
            </a>
            <a
              href={`/api/applications/${applicationId}/gist/export/pdf`}
              className="px-3 py-1.5 border rounded text-xs hover:bg-gray-50"
              download
            >
              Export PDF
            </a>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={!canEdit}
          rows={24}
          className="w-full px-5 py-4 text-sm font-mono text-gray-800 resize-none focus:outline-none disabled:bg-gray-50"
        />

        {canEdit && (
          <div className="flex justify-end px-5 py-3 border-t bg-gray-50">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
