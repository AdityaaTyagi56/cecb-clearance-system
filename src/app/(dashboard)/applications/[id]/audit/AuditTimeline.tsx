"use client";

interface AuditEntry {
  id: string;
  action: string;
  meta: unknown;
  createdAt: Date;
  actor: { name: string; role: string };
}

export default function AuditTimeline({ logs }: { logs: AuditEntry[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400">No audit events yet.</p>;
  }

  return (
    <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
      {logs.map((log) => (
        <div key={log.id} className="relative">
          <div className="absolute -left-[21px] top-1 w-4 h-4 bg-white border-2 border-green-500 rounded-full" />
          <div className="bg-white rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800">{log.action.replace(/_/g, " ")}</span>
              <span className="text-xs text-gray-400">
                {new Date(log.createdAt).toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              by <span className="font-medium">{log.actor.name}</span> ({log.actor.role})
            </p>
            {log.meta && Object.keys(log.meta as object).length > 0 && (
              <pre className="mt-2 bg-gray-50 rounded p-2 text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(log.meta, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
