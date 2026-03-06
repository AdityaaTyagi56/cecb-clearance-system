import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PdfPrinter from "pdfmake";

type PdfPrinterCtor = new (fonts: Record<string, unknown>) => {
  createPdfKitDocument: (docDefinition: unknown) => {
    on: (event: "data" | "end" | "error", callback: (...args: unknown[]) => void) => void;
    end: () => void;
  };
};

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
  const content = gist.editedContent ?? gist.generatedContent;

  const Printer = PdfPrinter as unknown as PdfPrinterCtor;
  const printer = new Printer(fonts);

  const docDefinition = {
    content: [
      { text: "Minutes of Meeting", style: "header" },
      {
        text: `Application: ${gist.application.applicationNumber}`,
        style: "subheader",
        margin: [0, 8, 0, 4],
      },
      { text: `Project: ${gist.application.projectName}`, margin: [0, 0, 0, 12] },
      ...content.split("\n").map((line) => ({ text: line, margin: [0, 2, 0, 2] })),
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 13, bold: true },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks: Buffer[] = [];

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on("data", (chunk) => {
      chunks.push(chunk as Buffer);
    });
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", (err) => reject(err));
    pdfDoc.end();
  });
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="MoM-${gist.application.applicationNumber}.pdf"`,
    },
  });
}
