import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gist = await prisma.meetingGist.findUnique({
    where: { applicationId: params.id },
    include: { application: { select: { applicationNumber: true, projectName: true } } },
  });

  if (!gist) return NextResponse.json({ error: "Gist not found" }, { status: 404 });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Minutes of Meeting",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Application: ${gist.application.applicationNumber}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Project: ${gist.application.projectName}`,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          ...gist.content.split("\n").map(
            (line) => new Paragraph({ children: [new TextRun(line)] })
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="MoM-${gist.application.applicationNumber}.docx"`,
    },
  });
}
