"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SECTORS, CATEGORIES, CG_DISTRICTS } from "@/types";

const STEPS = ["Project Details", "Location & Description", "Review"];

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    projectName: "",
    sector: "",
    category: "",
    investmentAmount: "",
    district: "",
    village: "",
    tahsil: "",
    surveyNumbers: "",
    projectArea: "",
    proposedActivities: "",
    existingEnvironmentStatus: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          investmentAmount: parseFloat(form.investmentAmount),
          projectArea: parseFloat(form.projectArea),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create application");
      }
      const app = await res.json();
      router.push(`/applications/${app.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Environmental Clearance Application</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                i < step
                  ? "bg-green-600 text-white"
                  : i === step
                  ? "bg-green-700 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${i === step ? "font-medium" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
              placeholder="e.g., XYZ Mining Expansion Project"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.sector}
              onChange={(e) => update("sector", e.target.value)}
            >
              <option value="">Select sector</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount (₹) *</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.investmentAmount}
              onChange={(e) => update("investmentAmount", e.target.value)}
              placeholder="e.g., 5000000"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
            >
              <option value="">Select district</option>
              {CG_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahsil</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.tahsil}
                onChange={(e) => update("tahsil", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.village}
                onChange={(e) => update("village", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Survey Numbers</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.surveyNumbers}
                onChange={(e) => update("surveyNumbers", e.target.value)}
                placeholder="e.g., 123/A, 124"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Area (ha)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.projectArea}
                onChange={(e) => update("projectArea", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Activities *</label>
            <textarea
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.proposedActivities}
              onChange={(e) => update("proposedActivities", e.target.value)}
              placeholder="Describe proposed activities, processes, raw material handling, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Existing Environment Status</label>
            <textarea
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.existingEnvironmentStatus}
              onChange={(e) => update("existingEnvironmentStatus", e.target.value)}
              placeholder="Describe current environmental condition of the site"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-gray-50 rounded-lg p-5 space-y-3 text-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Review Your Application</h2>
          {[
            ["Project Name", form.projectName],
            ["Sector", form.sector],
            ["Category", form.category],
            ["Investment", `₹${Number(form.investmentAmount).toLocaleString("en-IN")}`],
            ["District", form.district],
            ["Tahsil", form.tahsil],
            ["Village", form.village],
            ["Survey Numbers", form.surveyNumbers],
            ["Project Area", form.projectArea ? `${form.projectArea} ha` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value || "—"}</span>
            </div>
          ))}
          <div className="pt-2 border-t">
            <p className="text-gray-500 mb-1">Proposed Activities</p>
            <p className="text-gray-800">{form.proposedActivities || "—"}</p>
          </div>
          <p className="text-xs text-gray-400 pt-2">
            This will be saved as a DRAFT. You can edit and upload documents before submitting.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="px-5 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Application"}
          </button>
        )}
      </div>
    </div>
  );
}
