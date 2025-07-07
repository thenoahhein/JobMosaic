import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const createCandidate = mutation({
  args: {
    userId: v.id("users"),
    resumeText: v.string(),
    embedding: v.array(v.float64()),
    skills: v.array(v.string()),
    latentScore: v.float64(),
    resumeFileId: v.optional(v.id("_storage")),
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
        resumeFileId: args.resumeFileId,
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
        resumeFileId: args.resumeFileId,
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

export const getResumeFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const processResumeWithStorage = action({
  args: {
    fileUrl: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; candidateId: Id<"candidates">; parsedData: any }> => {
    // Download PDF from UploadThing
    const pdfResponse = await fetch(args.fileUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    // Store the PDF file in Convex storage
    const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const storageId = await ctx.storage.store(fileBlob);

    // Process with OpenAI
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Upload file to OpenAI
    const file = await openai.files.create({
      file: new File([pdfBuffer], "resume.pdf", { type: "application/pdf" }),
      purpose: "user_data",
    });

    const parseResponse = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: file.id,
            },
            {
              type: "input_text",
              text: `Parse this resume PDF and extract the following information in JSON format:
              {
                "skills": ["array of technical skills"],
                "summary": "brief professional summary",
                "experience": [{"company": "string", "role": "string", "duration": "string"}],
                "fullText": "complete text content of the resume for embedding generation"
              }`
            }
          ]
        }
      ]
    });

    const responseText = parseResponse.output_text;
    
    // Extract JSON from the response
    let parsedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (error) {
      console.error("Failed to parse JSON from response:", responseText);
      throw new Error("Failed to parse resume data");
    }

    const resumeText = parsedData.fullText || "";
    
    if (!resumeText.trim()) {
      throw new Error("Could not extract text from PDF");
    }

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: resumeText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Create candidate record
    const candidateId: Id<"candidates"> = await ctx.runMutation(internal.candidates.createCandidateInternal, {
      clerkId: args.clerkId,
      resumeText,
      embedding,
      skills: parsedData.skills || [],
      latentScore: 0,
      resumeFileId: storageId,
    });

    return {
      success: true,
      candidateId,
      parsedData,
    };
  },
});

export const createCandidateInternal = internalMutation({
  args: {
    clerkId: v.string(),
    resumeText: v.string(),
    embedding: v.array(v.float64()),
    skills: v.array(v.string()),
    latentScore: v.float64(),
    resumeFileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get user record
    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if candidate already exists for this user
    const existing = await ctx.db
      .query("candidates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existing) {
      // Update existing candidate
      await ctx.db.patch(existing._id, {
        resumeText: args.resumeText,
        embedding: args.embedding,
        skills: args.skills,
        latentScore: args.latentScore,
        resumeFileId: args.resumeFileId,
        createdAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new candidate
      return await ctx.db.insert("candidates", {
        userId: user._id,
        resumeText: args.resumeText,
        embedding: args.embedding,
        skills: args.skills,
        latentScore: args.latentScore,
        resumeFileId: args.resumeFileId,
        createdAt: Date.now(),
      });
    }
  },
});