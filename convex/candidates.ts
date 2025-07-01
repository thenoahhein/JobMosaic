import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const createCandidate = mutation({
  args: {
    userId: v.id("users"),
    resumeText: v.string(),
    embedding: v.array(v.float64()),
    skills: v.array(v.string()),
    latentScore: v.float64(),
    parsedData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if candidate already exists for this user
    const existing = await ctx.db
      .query("candidates")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      // Update existing candidate
      await ctx.db.patch(existing._id, {
        resumeText: args.resumeText,
        embedding: args.embedding,
        skills: args.skills,
        latentScore: args.latentScore,
        createdAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new candidate
      return await ctx.db.insert("candidates", {
        userId: args.userId,
        resumeText: args.resumeText,
        embedding: args.embedding,
        skills: args.skills,
        latentScore: args.latentScore,
        createdAt: Date.now(),
      });
    }
  },
});

export const getCandidateByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("candidates")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  },
});

export const getCurrentCandidate = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) return null;
    
    return await ctx.db
      .query("candidates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
  },
});

export const updateLatentScore = mutation({
  args: {
    candidateId: v.id("candidates"),
    latentScore: v.float64(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      latentScore: args.latentScore,
    });
  },
});

export const getAllCandidates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("candidates").collect();
  },
});