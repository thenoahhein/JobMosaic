import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function withRole(requiredRole: "candidate" | "recruiter") {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await convex.query(api.users.getUserByClerkId, {
    clerkId: userId,
  });

  if (!user || user.role !== requiredRole) {
    throw new Error("Insufficient permissions");
  }

  return { userId, user };
}