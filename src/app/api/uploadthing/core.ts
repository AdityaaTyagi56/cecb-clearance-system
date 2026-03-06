// src/app/api/uploadthing/core.ts — UploadThing file router (PRD Section 6)
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Environmental clearance document uploader
  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl, name: file.name, size: file.size };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
