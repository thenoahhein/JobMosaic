"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"candidate" | "recruiter" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const upsertUser = useMutation(api.users.upsertUser);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return;
    
    setIsLoading(true);
    try {
      await upsertUser({
        clerkId: user.id,
        role: selectedRole,
      });
      
      if (selectedRole === "candidate") {
        router.push("/candidate/onboard");
      } else {
        router.push("/recruiter/dashboard");
      }
    } catch (error) {
      console.error("Error setting user role:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Latent Talent Graph</CardTitle>
          <CardDescription>
            Choose your role to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>I am a...</Label>
            <div className="space-y-2">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === "candidate" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:bg-muted"
                }`}
                onClick={() => setSelectedRole("candidate")}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="candidate"
                    name="role"
                    value="candidate"
                    checked={selectedRole === "candidate"}
                    onChange={() => setSelectedRole("candidate")}
                    className="h-4 w-4"
                  />
                  <div>
                    <Label htmlFor="candidate" className="font-semibold">
                      AI Engineer Candidate
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Upload your résumé and get matched with opportunities
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === "recruiter" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:bg-muted"
                }`}
                onClick={() => setSelectedRole("recruiter")}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="recruiter"
                    name="role"
                    value="recruiter"
                    checked={selectedRole === "recruiter"}
                    onChange={() => setSelectedRole("recruiter")}
                    className="h-4 w-4"
                  />
                  <div>
                    <Label htmlFor="recruiter" className="font-semibold">
                      Recruiter
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Post jobs and find the best AI engineering talent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleRoleSelection}
            disabled={!selectedRole || isLoading}
            className="w-full"
          >
            {isLoading ? "Setting up..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}