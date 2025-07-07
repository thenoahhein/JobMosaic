"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";

export default function CandidateOnboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const processResumeFromUrl = async (fileUrl: string) => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Processing PDF...");

      const response = await fetch("/api/process-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl }),
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      await response.json();
      setProcessingStatus("Complete! Redirecting...");
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push("/candidate/profile");
    } catch (error) {
      console.error("Processing error:", error);
      alert(`Processing failed: ${error}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-120px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Your Résumé</CardTitle>
          <CardDescription>
            Upload your PDF résumé to get started with AI-powered matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isProcessing ? (
            <div className="space-y-4">
              <Label>Upload PDF Résumé</Label>
              <UploadDropzone
                endpoint="resumeUploader"
                onClientUploadComplete={(res) => {
                  console.log("Files: ", res);
                  if (res?.[0]?.url) {
                    processResumeFromUrl(res[0].url);
                  }
                }}
                onUploadError={(error: Error) => {
                  alert(`Upload Error! ${error.message}`);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Processing Resume...</span>
              </div>
              {processingStatus && (
                <p className="text-sm text-muted-foreground">{processingStatus}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}