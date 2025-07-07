"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Award, FileText, Download } from "lucide-react";
import Link from "next/link";

export default function CandidateProfilePage() {
  const candidate = useQuery(api.candidates.getCurrentCandidate);
  const fileUrl = useQuery(
    api.candidates.getResumeFileUrl,
    candidate?.resumeFileId ? { storageId: candidate.resumeFileId } : "skip"
  );

  if (candidate === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (candidate === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>No Profile Found</CardTitle>
            <CardDescription>
              You haven&apos;t uploaded your résumé yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/candidate/onboard">
              <Button>Upload Résumé</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Resume Profile</h1>
            <p className="text-muted-foreground">
              Your résumé has been analyzed and processed
            </p>
          </div>
          {fileUrl && (
            <a 
              href={fileUrl} 
              download="resume.pdf"
              className="flex items-center space-x-2 text-primary hover:text-primary/80"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </a>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Skills Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Technical Skills</span>
              </CardTitle>
              <CardDescription>
                Skills extracted from your résumé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No skills detected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resume File */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Resume File</span>
              </CardTitle>
              <CardDescription>
                Your uploaded resume document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    UPLOADED
                  </h4>
                  <p className="text-sm">
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    SKILLS DETECTED
                  </h4>
                  <p className="text-sm">
                    {candidate.skills.length} technical skills identified
                  </p>
                </div>
                
                {fileUrl && (
                  <>
                    <Separator />
                    <div className="flex justify-center">
                      <a 
                        href={fileUrl} 
                        download="resume.pdf"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Resume</span>
                      </a>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resume Text Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Resume Text</CardTitle>
            <CardDescription>
              Complete text content extracted from your PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {candidate.resumeText}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Link href="/candidate/onboard">
            <Button variant="outline">
              Upload New Resume
            </Button>
          </Link>
          <Button>
            View Matching Jobs
          </Button>
        </div>
      </div>
    </div>
  );
}