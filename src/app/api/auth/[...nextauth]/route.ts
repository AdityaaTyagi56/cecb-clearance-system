// api/auth/[...nextauth]/route.ts — NextAuth v5 App Router handler

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
