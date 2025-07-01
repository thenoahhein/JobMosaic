"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Award, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function CandidateProfilePage() {
  const candidate = useQuery(api.candidates.getCurrentCandidate);

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

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your AI Profile</h1>
            <p className="text-muted-foreground">
              Your résumé has been analyzed and processed
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <Badge 
              variant={getScoreBadgeVariant(candidate.latentScore)}
              className={`${getScoreColor(candidate.latentScore)} font-bold`}
            >
              Latent Score: {Math.round(candidate.latentScore)}
            </Badge>
          </div>
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

          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Summary</span>
              </CardTitle>
              <CardDescription>
                AI-generated insights about your background
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    LATENT SCORE BREAKDOWN
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          candidate.latentScore >= 80 ? 'bg-green-500' :
                          candidate.latentScore >= 60 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(candidate.latentScore, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(candidate.latentScore)}/100
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    RESUME UPLOADED
                  </h4>
                  <p className="text-sm">
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    SKILLS COUNT
                  </h4>
                  <p className="text-sm">
                    {candidate.skills.length} technical skills identified
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resume Text Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Resume Text</CardTitle>
            <CardDescription>
              Text extracted from your PDF for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {candidate.resumeText.substring(0, 1000)}
                {candidate.resumeText.length > 1000 && "..."}
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