// lib/audit.ts — Helper to write audit log entries

import { prisma } from "./prisma";
import type { ApplicationStatus } from "@prisma/client";

interface CreateAuditLogParams {
  applicationId: string;
  performedById: string;
  action: string;
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      applicationId: params.applicationId,
      performedById: params.performedById,
      action: params.action,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      metadata: params.metadata ?? undefined,
    },
  });
}
