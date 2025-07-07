import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("candidate"), v.literal("recruiter"))
  }).index("byClerk", ["clerkId"]),

  candidates: defineTable({
    userId: v.id("users"),
    resumeText: v.string(),
    embedding: v.array(v.float64()),
    skills: v.array(v.string()),
    latentScore: v.float64(),
    resumeFileId: v.optional(v.id("_storage")),
    createdAt: v.number()
  }).vectorIndex("byEmbedding", {
    vectorField: "embedding",
    dimensions: 1536
  }),

  jobs: defineTable({
    userId: v.id("users"),
    title: v.string(),
    jdText: v.string(),
    embedding: v.array(v.float64()),
    createdAt: v.number(),
    filled: v.boolean()
  }).vectorIndex("byEmbedding", {
    vectorField: "embedding",
    dimensions: 1536
  }),

  messages: defineTable({
    jobId: v.id("jobs"),
    candidateId: v.id("candidates"),
    fromUserId: v.id("users"),
    body: v.string(),
    createdAt: v.number()
  }).index("byThread", ["jobId", "candidateId"])
});
