import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resumeParserSchema = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      items: { type: "string" },
      description: "Array of technical skills mentioned in the resume"
    },
    summary: {
      type: "string",
      description: "Brief professional summary of the candidate"
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          duration: { type: "string" }
        }
      }
    }
  },
  required: ["skills", "summary"]
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Extract text from PDF
    const buffer = await file.arrayBuffer();
    const pdfData = await pdfParse(Buffer.from(buffer));
    const resumeText = pdfData.text;

    if (!resumeText.trim()) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    // Get user record from Convex
    const user = await convex.query(api.users.getUserByClerkId, {
      clerkId: userId,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse resume with OpenAI
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a resume parser. Extract structured information from the resume text provided. Focus on technical skills, experience, and provide a professional summary."
        },
        {
          role: "user",
          content: `Parse this resume and extract the information according to the schema:\n\n${resumeText}`
        }
      ],
      functions: [
        {
          name: "parse_resume",
          description: "Parse resume information into structured format",
          parameters: resumeParserSchema
        }
      ],
      function_call: { name: "parse_resume" }
    });

    const parsedData = JSON.parse(
      parseResponse.choices[0].message.function_call?.arguments || "{}"
    );

    // Generate embedding for the full resume text
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: resumeText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Create candidate record in Convex
    const candidateId = await convex.mutation(api.candidates.createCandidate, {
      userId: user._id,
      resumeText,
      embedding,
      skills: parsedData.skills || [],
      latentScore: 0, // Will be updated by cron job
      parsedData,
    });

    return NextResponse.json({
      success: true,
      candidateId,
      parsedData,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}