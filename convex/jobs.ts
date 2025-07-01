import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import OpenAI from "openai";

export const createJob = mutation({
  args: {
    title: v.string(),
    jdText: v.string(),
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

    // Generate embedding for job description
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: args.jdText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    return await ctx.db.insert("jobs", {
      userId: user._id,
      title: args.title,
      jdText: args.jdText,
      embedding,
      createdAt: Date.now(),
      filled: false,
    });
  },
});

export const getJobById = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getJobsByRecruiter = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "recruiter") return null;

    return await ctx.db
      .query("jobs")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();
  },
});

export const getMatchesForJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return [];

    // Get all candidates with good latent scores
    // TODO: Implement vector search when available
    const allCandidates = await ctx.db.query("candidates").collect();
    
    // Filter by latent score >= 60 and include user details
    const matches = [];
    for (const candidate of allCandidates) {
      if (candidate.latentScore >= 60) {
        const user = await ctx.db.get(candidate.userId);
        matches.push({
          ...candidate,
          user,
          similarity: 0.85, // Mock similarity for now
        });
      }
    }

    return matches.sort((a, b) => b.latentScore - a.latentScore);
  },
});

export const markJobFilled = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || job.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.jobId, { filled: true });
  },
});