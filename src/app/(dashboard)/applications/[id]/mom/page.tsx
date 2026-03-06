import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import MomEditor from "./MomEditor";

export default async function MomPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const gist = await prisma.meetingGist.findUnique({
    where: { applicationId: params.id },
    include: {
      application: {
        select: { applicationNumber: true, projectName: true, proponentId: true },
      },
    },
  });

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    select: { applicationNumber: true, projectName: true, proponentId: true },
  });

  if (!app) notFound();
  if (session.user.role === Role.PROPONENT && app.proponentId !== session.user.id) {
    redirect("/applications/mine");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Minutes of Meeting</h1>
      <p className="text-sm text-gray-500 mb-6">{app.applicationNumber} · {app.projectName}</p>

      {!gist ? (
        <div className="bg-gray-50 rounded-lg border p-8 text-center text-gray-500">
          <p>Meeting gist has not been generated yet.</p>
          <p className="text-sm mt-1">It will be auto-generated when the application is referred to the meeting committee.</p>
        </div>
      ) : (
        <MomEditor
          applicationId={params.id}
          gist={gist}
          userRole={session.user.role}
        />
      )}
    </div>
  );
}
