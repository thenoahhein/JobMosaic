import { internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { v } from "convex/values";

export const updateAllLatentScores = internalAction({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.runQuery(internal.scoring.getAllCandidatesForScoring);
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    for (const candidate of candidates) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an AI hiring specialist. Rate the resume for a mid-senior AI engineer role on a scale of 0-100. Consider technical skills, experience, education, and overall fit for AI engineering roles. Return only the numeric score."
            },
            {
              role: "user",
              content: `Rate this resume for an AI engineer position:\n\n${candidate.resumeText}`
            }
          ],
          max_tokens: 10,
          temperature: 0.1,
        });

        const scoreText = response.choices[0].message.content?.trim();
        const score = parseFloat(scoreText || "0");
        
        if (!isNaN(score) && score >= 0 && score <= 100) {
          await ctx.runMutation(internal.scoring.updateCandidateScore, {
            candidateId: candidate._id,
            latentScore: score,
          });
        }
      } catch (error) {
        console.error(`Error scoring candidate ${candidate._id}:`, error);
      }
    }
  },
});

export const getAllCandidatesForScoring = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("candidates").collect();
  },
});

export const updateCandidateScore = internalMutation({
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