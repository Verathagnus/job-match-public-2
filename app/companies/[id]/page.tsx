"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Company, JobListing } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building, MapPin, Users, Globe, Calendar, Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CompanyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCompanyAndJobs = async () => {
      setLoading(true);
      try {
        // Fetch company
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", id)
          .single();

        if (companyError) throw companyError;

        // Fetch jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from("job_listings")
          .select("*")
          .eq("company_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        setCompany(companyData);
        setJobs(jobsData || []);
      } catch (error) {
        console.error("Error fetching company:", error);
        router.push("/companies");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyAndJobs();
  }, [id, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getCompanySize = (size: string) => {
    switch (size) {
      case "Small":
        return "1-50 employees";
      case "Medium":
        return "51-500 employees";
      case "Large":
        return "500+ employees";
      default:
        return size;
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Company not found</h3>
            <p className="text-muted-foreground mb-4">
              The company you're looking for may have been removed or doesn't exist.
            </p>
            <Link href="/companies">
              <Button>Browse Companies</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/companies">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="h-48 bg-muted flex items-center justify-center p-6 border-b">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Building className="h-24 w-24 text-muted-foreground" />
                )}
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  {company.industry && (
                    <Badge variant="secondary" className="mt-1">
                      {company.industry}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {company.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{company.location}</span>
                    </div>
                  )}
                  {company.size && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{getCompanySize(company.size)}</span>
                    </div>
                  )}
                  {company.founded_year && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Founded in {company.founded_year}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.website.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    </div>
                  )}
                </div>

                <Separator />

                {company.benefits && company.benefits.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Benefits</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {company.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="jobs">Open Positions ({jobs.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="mt-6 space-y-6">
              {company.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About {company.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{company.description}</p>
                  </CardContent>
                </Card>
              )}
              
              {company.mission && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{company.mission}</p>
                  </CardContent>
                </Card>
              )}
              
              {company.culture && (
                <Card>
                  <CardHeader>
                    <CardTitle>Company Culture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{company.culture}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="jobs" className="mt-6">
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{job.title}</h3>
                            <div className="flex items-center text-muted-foreground mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location || "Remote"}</span>
                              {job.is_remote && <span className="ml-2">(Remote Available)</span>}
                            </div>
                          </div>
                          <Link href="/jobs">
                            <Button className="mt-2 md:mt-0">Apply Now</Button>
                          </Link>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.job_type && (
                            <Badge variant="outline">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {job.job_type}
                            </Badge>
                          )}
                          {job.experience_level && (
                            <Badge variant="outline">
                              {job.experience_level}
                            </Badge>
                          )}
                          {job.application_deadline && (
                            <Badge variant="outline" className={
                              new Date(job.application_deadline) < new Date() ? "text-red-500" : ""
                            }>
                              <Calendar className="h-3 w-3 mr-1" />
                              Deadline: {formatDate(job.application_deadline)}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {job.description}
                        </p>
                        
                        {job.skills_required && job.skills_required.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Skills Required</h4>
                            <div className="flex flex-wrap gap-1">
                              {job.skills_required.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No open positions</h3>
                    <p className="text-muted-foreground">
                      {company.name} doesn't have any open positions at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}