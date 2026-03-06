// lib/workflow.ts — Server-enforced state machine (PRD Section 5)
// NEVER call status transitions without going through isValidTransition()

import type { ApplicationStatus, Role } from "@prisma/client";

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT:                ["SUBMITTED"],
  SUBMITTED:            ["UNDER_SCRUTINY"],
  UNDER_SCRUTINY:       ["ESSENTIAL_DOC_SOUGHT", "REFERRED"],
  ESSENTIAL_DOC_SOUGHT: ["UNDER_SCRUTINY"],
  REFERRED:             ["MOM_GENERATED"],
  MOM_GENERATED:        ["FINALIZED"],
  FINALIZED:            [], // terminal state — no further transitions
};

export function isValidTransition(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canRoleTransition(
  role: Role,
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  const roleTransitionMap: Record<Role, [ApplicationStatus, ApplicationStatus][]> = {
    ADMIN: [],
    PROPONENT: [
      ["DRAFT", "SUBMITTED"],
      ["ESSENTIAL_DOC_SOUGHT", "UNDER_SCRUTINY"],
    ],
    SCRUTINY: [
      ["SUBMITTED", "UNDER_SCRUTINY"],
      ["UNDER_SCRUTINY", "ESSENTIAL_DOC_SOUGHT"],
      ["UNDER_SCRUTINY", "REFERRED"],
    ],
    MOM_TEAM: [
      ["MOM_GENERATED", "FINALIZED"],
    ],
  };

  return roleTransitionMap[role]?.some(([f, t]) => f === from && t === to) ?? false;
}
