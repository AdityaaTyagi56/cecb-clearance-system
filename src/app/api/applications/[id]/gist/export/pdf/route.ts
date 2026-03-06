import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PdfPrinter from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

const fonts = {
  Roboto: {
    normal: "node_modules/pdfmake/build/vfs_fonts.js",
    bold: "node_modules/pdfmake/build/vfs_fonts.js",
    italics: "node_modules/pdfmake/build/vfs_fonts.js",
    bolditalics: "node_modules/pdfmake/build/vfs_fonts.js",
  },
};

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

  const printer = new PdfPrinter(fonts);

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: "Minutes of Meeting", style: "header" },
      {
        text: `Application: ${gist.application.applicationNumber}`,
        style: "subheader",
        margin: [0, 8, 0, 4],
      },
      { text: `Project: ${gist.application.projectName}`, margin: [0, 0, 0, 12] },
      ...gist.content.split("\n").map((line) => ({ text: line, margin: [0, 2, 0, 2] })),
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 13, bold: true },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks: Buffer[] = [];

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="MoM-${gist.application.applicationNumber}.pdf"`,
    },
  });
}
