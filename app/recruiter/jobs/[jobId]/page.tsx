"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, RefreshCw, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  params: {
    jobId: string;
  };
}

export default function JobDetailPage({ params }: Props) {
  const jobId = params.jobId as Id<"jobs">;
  const job = useQuery(api.jobs.getJobById, { jobId });
  const matches = useQuery(api.jobs.getMatchesForJob, { jobId });
  const requestIntro = useMutation(api.messages.requestIntro);

  const handleIntroRequest = async (candidateId: Id<"candidates">) => {
    try {
      await requestIntro({
        jobId,
        candidateId,
        body: "Hi! I'm interested in discussing this opportunity with you. Your background looks like a great fit for our AI engineering role.",
      });
      alert("Intro request sent successfully!");
    } catch (error) {
      console.error("Error sending intro request:", error);
      alert("Failed to send intro request. Please try again.");
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 70) return "secondary";
    return "outline";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-orange-600";
  };

  if (job === undefined || matches === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>
              The job you&apos;re looking for doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/recruiter/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/recruiter/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <p className="text-muted-foreground">
                Posted {new Date(job.createdAt).toLocaleDateString()} • 
                {matches?.length || 0} matching candidates
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {job.filled ? (
              <Badge variant="secondary">
                <CheckCircle className="mr-1 h-3 w-3" />
                Filled
              </Badge>
            ) : (
              <Badge variant="default">Active</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Job Description */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-sm">
                    {job.jdText}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Candidate Matches */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Matching Candidates</span>
                  {matches && (
                    <Badge variant="outline">{matches.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  AI-powered matches ranked by relevance and latent score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matches && matches.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
                    <p className="text-muted-foreground text-sm">
                      New candidates are automatically matched as they upload résumés.
                      Check back later or refresh the page.
                    </p>
                    <Button variant="outline" className="mt-4">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches?.map((match) => (
                      <Card key={match._id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-semibold">AI Engineer Candidate</h4>
                                <p className="text-sm text-muted-foreground">
                                  Uploaded {new Date(match.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={getScoreBadgeVariant(match.latentScore)}
                                  className={getScoreColor(match.latentScore)}
                                >
                                  Score: {Math.round(match.latentScore)}
                                </Badge>
                                <Badge variant="outline">
                                  {Math.round(match.similarity * 100)}% match
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">
                                  SKILLS
                                </h5>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.skills.slice(0, 8).map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {match.skills.length > 8 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{match.skills.length - 8} more
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">
                                  RESUME PREVIEW
                                </h5>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {match.resumeText.substring(0, 200)}...
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button 
                            size="sm"
                            onClick={() => handleIntroRequest(match._id)}
                            className="ml-4"
                          >
                            <Mail className="mr-2 h-3 w-3" />
                            Request Intro
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}