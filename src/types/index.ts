// CECB Environmental Clearance System — Shared TypeScript Types

import type {
  Role,
  ApplicationStatus,
  DocumentType,
  User,
  Application,
  Document,
  DeficiencyNote,
  MeetingGist,
  AuditLog,
} from "@prisma/client";

// Re-export Prisma enums for convenience
export { Role, ApplicationStatus, DocumentType };

// ─── Session / Auth ──────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// ─── API Response wrappers ───────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Application with relations ──────────────────────────────────────────────

export type ApplicationWithRelations = Application & {
  proponent: Pick<User, "id" | "name" | "email">;
  documents: Document[];
  deficiencyNotes: DeficiencyNote[];
  meetingGist: MeetingGist | null;
  auditLogs: AuditLog[];
};

// ─── Workflow ────────────────────────────────────────────────────────────────

export type WorkflowTransition = {
  from: ApplicationStatus;
  to: ApplicationStatus;
  triggeredBy: Role | "SYSTEM";
};

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface ApplicationFormStep1 {
  projectName: string;
  projectDescription: string;
  sector: string;
  category: string;
}

export interface ApplicationFormStep2 {
  projectLocation: string;
  surveyNumber: string;
  districtName: string;
  stateName: string;
  projectAreaHa: number;
}

export interface ApplicationFormStep3 {
  documents: {
    documentType: DocumentType;
    file: File;
  }[];
}

export interface ApplicationFormStep4 {
  feeAmount: number;
  paymentId?: string;
  feePaid: boolean;
}

export type ApplicationFormData = ApplicationFormStep1 &
  ApplicationFormStep2 &
  Partial<ApplicationFormStep3> &
  Partial<ApplicationFormStep4>;

// ─── Sector / Category constants ─────────────────────────────────────────────

export const SECTORS = [
  "Mining",
  "Manufacturing",
  "Infrastructure",
  "Power",
  "Tourism",
  "Other",
] as const;

export const CATEGORIES = [
  "Category A",
  "Category B",
  "Category B1",
  "Category B2",
] as const;

export const CG_DISTRICTS = [
  "Balod",
  "Baloda Bazar",
  "Balrampur",
  "Bastar",
  "Bemetara",
  "Bijapur",
  "Bilaspur",
  "Dantewada",
  "Dhamtari",
  "Durg",
  "Gariaband",
  "Gaurela-Pendra-Marwahi",
  "Janjgir-Champa",
  "Jashpur",
  "Kabirdham",
  "Kanker",
  "Khairagarh",
  "Kondagaon",
  "Korba",
  "Koriya",
  "Mahasamund",
  "Manendragarh",
  "Mohla-Manpur",
  "Mungeli",
  "Narayanpur",
  "Raigarh",
  "Raipur",
  "Rajnandgaon",
  "Sakti",
  "Sarangarh-Bilaigarh",
  "Sukma",
  "Surajpur",
  "Surguja",
] as const;

export type Sector = (typeof SECTORS)[number];
export type Category = (typeof CATEGORIES)[number];
export type District = (typeof CG_DISTRICTS)[number];
