"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Application } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase, Building, MapPin, Calendar, Eye, EyeOff, Edit } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"public" | "anonymous">("public");

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select(`
            *,
            job:job_listings(
              *,
              company:companies(*)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setApplications(data || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, router]);

  if (!user || !profile) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayProfile = viewMode === "public" ? {
    name: profile.full_name,
    bio: profile.bio,
    avatar: profile.avatar_url,
    title: profile.title,
    experience: profile.years_of_experience ? `${profile.years_of_experience} years` : "Not specified",
    skills: profile.skills || [],
    education: profile.education || [],
    workHistory: profile.work_history || [],
  } : {
    name: profile.anonymous_name || "Anonymous User",
    bio: profile.anonymous_bio || "No anonymous bio provided",
    avatar: profile.anonymous_avatar_url,
    title: profile.anonymous_title || "Professional",
    experience: profile.anonymous_years_of_experience || "Not specified",
    skills: profile.anonymous_skills || [],
    education: profile.anonymous_education || [],
    workHistory: profile.anonymous_work_history || [],
  };

  return (
    <div className="container py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "public" ? "anonymous" : "public")}
          >
            {viewMode === "public" ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                View Anonymous
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Public
              </>
            )}
          </Button>
          <Link href="/profile/edit">
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={displayProfile.avatar || ""} alt={displayProfile.name} />
                <AvatarFallback className="text-2xl">{displayProfile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle>{displayProfile.name}</CardTitle>
              <CardDescription className="text-base">{displayProfile.title}</CardDescription>
              
              <Badge variant="outline" className="mt-2">
                {viewMode === "public" ? "Public Profile" : "Anonymous Profile"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">About</h3>
                <p className="text-sm text-muted-foreground">
                  {displayProfile.bio || "No bio provided"}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-1">Experience</h3>
                <p className="text-sm text-muted-foreground">{displayProfile.experience}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-1">Skills</h3>
                {displayProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {displayProfile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="experience">Work Experience</TabsTrigger>
            </TabsList>
            
            <TabsContent value="applications" className="space-y-4 mt-4">
              <h2 className="text-xl font-semibold mb-2">Recent Applications</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => {
                    const job = application.job as any;
                    const company = job?.company;
                    
                    return (
                      <Card key={application.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{job?.title}</h3>
                              <div className="flex items-center text-muted-foreground mt-1">
                                <Building className="h-4 w-4 mr-1" />
                                <span>{company?.name}</span>
                              </div>
                              {job?.location && (
                                <div className="flex items-center text-muted-foreground mt-1">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  <span>{job.location}</span>
                                </div>
                              )}
                            </div>
                            <Badge className={
                              application.status === "accepted" ? "bg-green-500" :
                              application.status === "rejected" ? "bg-red-500" :
                              application.status === "interview" ? "bg-blue-500" :
                              "bg-yellow-500"
                            }>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center text-muted-foreground mt-2 text-sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Applied on {new Date(application.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  <div className="text-center">
                    <Link href="/applications">
                      <Button variant="outline">View All Applications</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No applications yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start swiping on jobs to submit applications
                    </p>
                    <Link href="/jobs">
                      <Button>Find Jobs</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="education" className="space-y-4 mt-4">
              <h2 className="text-xl font-semibold mb-2">Education</h2>
              
              {displayProfile.education.length > 0 ? (
                <div className="space-y-4">
                  {displayProfile.education.map((edu, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{edu}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No education details</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your education history to complete your profile
                    </p>
                    <Link href="/profile/edit">
                      <Button>Add Education</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="experience" className="space-y-4 mt-4">
              <h2 className="text-xl font-semibold mb-2">Work Experience</h2>
              
              {displayProfile.workHistory.length > 0 ? (
                <div className="space-y-4">
                  {displayProfile.workHistory.map((work: any, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{work.title}</h3>
                        <div className="flex items-center text-muted-foreground mt-1">
                          <Building className="h-4 w-4 mr-1" />
                          <span>{work.company}</span>
                        </div>
                        {work.period && (
                          <div className="flex items-center text-muted-foreground mt-1 text-sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{work.period}</span>
                          </div>
                        )}
                        {work.description && (
                          <p className="mt-2 text-sm">{work.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No work experience</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your work history to complete your profile
                    </p>
                    <Link href="/profile/edit">
                      <Button>Add Experience</Button>
                    </Link>
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