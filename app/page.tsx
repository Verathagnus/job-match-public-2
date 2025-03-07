"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, Users, MessageSquare, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Find Your Perfect Job Match, <span className="text-primary">Anonymously</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Connect with startups that value your skills, not your background.
                Swipe right on opportunities that match your expertise.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/jobs">
                <Button size="lg" className="animate-pulse">
                  Start Applying
                </Button>
              </Link>
              {!user && (
                <Link href="/auth/register">
                  <Button variant="outline" size="lg">
                    Create Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 sm:justify-items-center lg:justify-center">
            {/* Anonymous Profiles */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Anonymous Profiles</h3>
              <p className="text-muted-foreground max-w-[400px] mx-auto px-4">
                Create an anonymous profile that highlights your skills without revealing personal details.
              </p>
            </div>

            {/* Swipe to Apply */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <BriefcaseBusiness className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Swipe to Apply</h3>
              <p className="text-muted-foreground max-w-[400px] mx-auto px-4">
                Browse job opportunities from innovative startups and apply with a simple swipe right.
              </p>
            </div>

            {/* Community Discussions */}
            <div className="flex flex-col items-center text-center space-y-4 
                         sm:col-span-2 sm:justify-self-center lg:col-span-1">
              <div className="p-4 bg-primary/10 rounded-full">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Community Discussions</h3>
              <p className="text-muted-foreground max-w-[400px] mx-auto px-4">
                Join anonymous discussions about companies, interview experiences, and career advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Our platform makes job hunting simple, fair, and focused on what matters most - your skills.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-12 lg:gap-16 mt-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-bold">Create Your Profiles</h3>
              <p className="text-muted-foreground">
                Set up both your real and anonymous profiles, highlighting your skills and experience.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-bold">Swipe on Jobs</h3>
              <p className="text-muted-foreground">
                Browse through job cards and swipe right on positions that interest you to apply instantly.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-bold">Connect & Discuss</h3>
              <p className="text-muted-foreground">
                Join community discussions to learn more about companies and share your experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Find Your Next Opportunity?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Join thousands of professionals who found their dream jobs through our platform.
              </p>
            </div>
            <div className="space-x-4">
              {user ? (
                <Link href="/jobs">
                  <Button size="lg">
                    Browse Jobs
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/register">
                  <Button size="lg">
                    Get Started
                  </Button>
                </Link>
              )}
              <Link href="/companies">
                <Button variant="outline" size="lg">
                  Browse Companies
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}