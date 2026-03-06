// lib/gist-generator.ts — Auto-generate Meeting Gist when application is REFERRED (PRD 8.1)

import { prisma } from "./prisma";

function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [placeholder, value] of Object.entries(values)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

export async function generateMeetingGist(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      proponent: true,
      documents: true,
      deficiencyNotes: true,
    },
  });

  if (!application) throw new Error(`Application ${applicationId} not found`);

  // Find sector-specific template first, fall back to "ALL"
  const template =
    (await prisma.masterTemplate.findFirst({
      where: { sector: application.sector, isActive: true },
      orderBy: { createdAt: "desc" },
    })) ??
    (await prisma.masterTemplate.findFirst({
      where: { sector: "ALL", isActive: true },
    }));

  const rawContent = template?.content ?? defaultGistTemplate();

  const documentList = application.documents
    .map((d) => `• ${d.documentType} — ${d.fileName}`)
    .join("\n");

  const content = fillTemplate(rawContent, {
    "{{APPLICATION_NUMBER}}": application.applicationNumber,
    "{{PROJECT_NAME}}": application.projectName,
    "{{PROPONENT_NAME}}": application.proponent.name,
    "{{SECTOR}}": application.sector,
    "{{CATEGORY}}": application.category,
    "{{LOCATION}}": application.projectLocation ?? "Not specified",
    "{{DISTRICT}}": application.districtName ?? "Not specified",
    "{{SUBMITTED_DATE}}": application.submittedAt?.toLocaleDateString("en-IN") ?? "—",
    "{{FEE_STATUS}}": application.feePaid ? "Paid" : "Pending",
    "{{DOCUMENT_LIST}}": documentList,
    "{{MEETING_DATE}}": new Date().toLocaleDateString("en-IN"),
  });

  // Save gist and advance status to MOM_GENERATED
  const gist = await prisma.meetingGist.create({
    data: {
      applicationId,
      generatedContent: content,
    },
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "MOM_GENERATED" },
  });

  return gist;
}

function defaultGistTemplate(): string {
  return `CECB — Meeting Gist
Application Number : {{APPLICATION_NUMBER}}
Meeting Date       : {{MEETING_DATE}}
Project Name       : {{PROJECT_NAME}}
Proponent          : {{PROPONENT_NAME}}
Sector             : {{SECTOR}}
Category           : {{CATEGORY}}
Location           : {{LOCATION}}, {{DISTRICT}}, Chhattisgarh
Date of Submission : {{SUBMITTED_DATE}}
Fee Status         : {{FEE_STATUS}}

Documents Submitted:
{{DOCUMENT_LIST}}

Summary:
The above application has been scrutinised by the team and referred to the committee for consideration. All mandatory documents have been verified. The committee is requested to review this application and provide its recommendations.
`;
}
