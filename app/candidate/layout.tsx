"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Candidate Portal</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <nav className="flex items-center space-x-4">
                <Link 
                  href="/candidate/profile"
                  className={`text-sm transition-colors hover:text-primary ${
                    pathname === '/candidate/profile' 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground'
                  }`}
                >
                  Profile
                </Link>
                <Link 
                  href="/candidate/onboard"
                  className={`text-sm transition-colors hover:text-primary ${
                    pathname === '/candidate/onboard' 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground'
                  }`}
                >
                  Upload Resume
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="h-5">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Candidate
                      </Badge>
                    </div>
                  </div>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8"
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}