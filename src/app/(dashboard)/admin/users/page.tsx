import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; role?: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) redirect("/dashboard");

  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 25;
  const roleFilter = searchParams.role as Role | undefined;
  const where = roleFilter ? { role: roleFilter } : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <span className="text-sm text-gray-500">{total} users</span>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/admin/users" className={`px-3 py-1.5 rounded-full text-sm border ${!roleFilter ? "bg-green-700 text-white border-green-700" : "hover:bg-gray-50"}`}>
          All
        </Link>
        {Object.values(Role).map((r) => (
          <Link
            key={r}
            href={`/admin/users?role=${r}`}
            className={`px-3 py-1.5 rounded-full text-sm border ${roleFilter === r ? "bg-green-700 text-white border-green-700" : "hover:bg-gray-50"}`}
          >
            {r}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="text-green-700 text-xs hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}&role=${roleFilter ?? ""}`} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?page=${page + 1}&role=${roleFilter ?? ""}`} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
