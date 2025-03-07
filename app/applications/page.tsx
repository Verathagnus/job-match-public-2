"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Application } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Building, MapPin, Calendar, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchApplications = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("applications")
          .select(`
            *,
            job:job_listings(
              *,
              company:companies(*)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (activeTab !== "all") {
          query = query.eq("status", activeTab);
        }

        const { data, error } = await query;

        if (error) throw error;
        setApplications(data || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, router, activeTab]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "interview":
        return "bg-blue-500";
      default:
        return "bg-yellow-500";
    }
  };

  if (!user) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your job applications
          </p>
        </div>
        <Link href="/jobs">
          <Button>
            Find More Jobs
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => {
            const job = application.job as any;
            const company = job?.company;
            
            return (
              <Card key={application.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {company?.logo_url && (
                      <div className="w-full md:w-48 h-32 bg-muted flex items-center justify-center p-4 border-b md:border-b-0 md:border-r">
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <h2 className="text-xl font-bold">{job?.title}</h2>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <Building className="h-4 w-4 mr-1" />
                            <span>{company?.name}</span>
                          </div>
                          {job?.location && (
                            <div className="flex items-center text-muted-foreground mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location}</span>
                              {job.is_remote && <span className="ml-2">(Remote Available)</span>}
                            </div>
                          )}
                        </div>
                        <Badge className={`${getStatusColor(application.status)} mt-2 md:mt-0`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job?.job_type && (
                          <Badge variant="outline">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {job.job_type}
                          </Badge>
                        )}
                        {job?.skills_required && job.skills_required.length > 0 && (
                          <Badge variant="outline">
                            {job.skills_required.length} skills required
                          </Badge>
                        )}
                        {job?.application_deadline && (
                          <Badge variant="outline" className={
                            new Date(job.application_deadline) < new Date() ? "text-red-500" : ""
                          }>
                            <Calendar className="h-3 w-3 mr-1" />
                            Deadline: {formatDate(job.application_deadline)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Applied on {formatDate(application.created_at)}</span>
                        </div>
                        <Link href={`/companies/${company?.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Company
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No applications found</h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "all"
                ? "You haven't applied to any jobs yet."
                : `You don't have any applications with '${activeTab}' status.`}
            </p>
            <Link href="/jobs">
              <Button>Find Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}