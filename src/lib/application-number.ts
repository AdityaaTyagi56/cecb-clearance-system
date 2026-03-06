// lib/application-number.ts — Auto-generate unique application number (PRD 8.3)
// Format: CECB-YYYY-XXXXXX  e.g. CECB-2026-000001

import { prisma } from "./prisma";

export async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.application.count({
    where: {
      createdAt: { gte: new Date(year, 0, 1) },
    },
  });
  const serial = String(count + 1).padStart(6, "0");
  return `CECB-${year}-${serial}`;
}
