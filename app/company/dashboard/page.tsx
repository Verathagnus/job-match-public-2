"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  MapPin,
  Users,
  Globe,
  Calendar,
  Briefcase,
  Edit,
} from "lucide-react";

const companyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  website: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal("")),
  industry: z.string().min(2, {
    message: "Industry must be at least 2 characters.",
  }),
  size: z.string(),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  description: z.string().min(50, {
    message: "Description must be at least 50 characters.",
  }),
  mission: z.string().min(20, {
    message: "Mission statement must be at least 20 characters.",
  }),
  culture: z.string().min(20, {
    message: "Culture description must be at least 20 characters.",
  }),
  logo_url: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal("")),
});

export default function CompanyDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);

  const form = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
  });

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchCompanyData = async () => {
      // Fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      if (companyError || !companyData) {
        router.push("/");
        return;
      }

      setCompany(companyData);
      form.reset(companyData);

      // Fetch applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select(`
          *,
          job:job_listings(*),
          user:profiles(*)
        `)
        .eq("job.company_id", companyData.id)
        .order("created_at", { ascending: false });

      if (!applicationsError) {
        setApplications(applicationsData || []);
      }

      setLoading(false);
    };

    fetchCompanyData();
  }, [user, router, form]);

  const onSubmit = async (values: z.infer<typeof companyFormSchema>) => {
    if (!company) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update(values)
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Company updated",
        description: "Your company details have been updated successfully.",
      });

      setCompany({ ...company, ...values });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update company details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading company dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{company?.name}</h1>
            <p className="text-muted-foreground">Company Dashboard</p>
          </div>
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="company">Company Details</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Applications</CardTitle>
                <CardDescription>
                  Review and manage applications for your job listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length > 0 ? (
                    applications.map((application) => (
                      <Card key={application.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between">
                            <div>
                              <h3 className="font-semibold">
                                {application.job.title}
                              </h3>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                Applied on {formatDate(application.created_at)}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Users className="h-4 w-4 mr-1" />
                                {application.user.full_name}
                              </div>
                            </div>
                            <div className="mt-2 md:mt-0">
                              <Badge
                                className={
                                  application.status === "accepted"
                                    ? "bg-green-500"
                                    : application.status === "rejected"
                                    ? "bg-red-500"
                                    : application.status === "interview"
                                    ? "bg-blue-500"
                                    : "bg-yellow-500"
                                }
                              >
                                {application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No applications received yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>
                  Update your company information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Description</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mission Statement</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="culture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Culture</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={loading}>
                      <Edit className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}