// prisma/seed.ts — Seed an admin user and default "ALL" MoM template

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cecb.gov.in" },
    update: {},
    create: {
      name: "CECB Admin",
      email: "admin@cecb.gov.in",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`✅  Admin user: ${admin.email}`);

  // Seed default MoM template
  await prisma.masterTemplate.upsert({
    where: { id: "default-all-template" },
    update: {},
    create: {
      id: "default-all-template",
      name: "Default Meeting Gist Template",
      sector: "ALL",
      content: `CECB PARIVESH 3.0 — Minutes of Meeting

Application No : {{APPLICATION_NUMBER}}
Meeting Date   : {{MEETING_DATE}}
Project Name   : {{PROJECT_NAME}}
Proponent      : {{PROPONENT_NAME}}
Sector         : {{SECTOR}}
Category       : {{CATEGORY}}
Location       : {{LOCATION}}, {{DISTRICT}}, Chhattisgarh
Submission Date: {{SUBMITTED_DATE}}
Fee Status     : {{FEE_STATUS}}

Documents Submitted:
{{DOCUMENT_LIST}}

Committee Notes:
[To be filled by MoM Team]

Recommendations:
[To be filled by MoM Team]

Chairperson: ___________________    Date: ___________
`,
      isActive: true,
    },
  });
  console.log("✅  Default MoM template created");

  // Seed sector fee parameters
  const feeParams = [
    { sector: "Mining",         paramKey: "application_fee", paramValue: "50000" },
    { sector: "Manufacturing",  paramKey: "application_fee", paramValue: "25000" },
    { sector: "Infrastructure", paramKey: "application_fee", paramValue: "30000" },
    { sector: "Power",          paramKey: "application_fee", paramValue: "40000" },
    { sector: "Tourism",        paramKey: "application_fee", paramValue: "15000" },
    { sector: "Other",          paramKey: "application_fee", paramValue: "10000" },
  ];

  for (const param of feeParams) {
    await prisma.sectorParameter.upsert({
      where: { sector_paramKey: { sector: param.sector, paramKey: param.paramKey } },
      update: { paramValue: param.paramValue },
      create: { ...param, description: "Application processing fee in INR" },
    });
  }
  console.log("✅  Sector fee parameters seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
