import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const requestIntro = mutation({
  args: {
    jobId: v.id("jobs"),
    candidateId: v.id("candidates"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "recruiter") {
      throw new Error("Not authorized");
    }

    // Verify the job belongs to the recruiter
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== user._id) {
      throw new Error("Job not found or not authorized");
    }

    // Verify the candidate exists
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    // Check if intro request already exists
    const existing = await ctx.db
      .query("messages")
      .withIndex("byThread", (q) => 
        q.eq("jobId", args.jobId).eq("candidateId", args.candidateId)
      )
      .first();

    if (existing) {
      throw new Error("Intro request already sent for this job/candidate combination");
    }

    // Create the intro request message
    return await ctx.db.insert("messages", {
      jobId: args.jobId,
      candidateId: args.candidateId,
      fromUserId: user._id,
      body: args.body,
      createdAt: Date.now(),
    });
  },
});

export const getMessagesByThread = query({
  args: {
    jobId: v.id("jobs"),
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("byThread", (q) => 
        q.eq("jobId", args.jobId).eq("candidateId", args.candidateId)
      )
      .order("asc")
      .collect();
  },
});

export const getIntroRequestsForCandidate = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "candidate") return [];

    const candidate = await ctx.db
      .query("candidates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!candidate) return [];

    // Get all intro requests for this candidate
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("candidateId"), candidate._id))
      .collect();

    // Enrich with job and recruiter details
    const enriched = [];
    for (const message of messages) {
      const job = await ctx.db.get(message.jobId);
      const recruiter = await ctx.db.get(message.fromUserId);
      enriched.push({
        ...message,
        job,
        recruiter,
      });
    }

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});