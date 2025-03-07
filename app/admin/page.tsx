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
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building, Plus, Shield, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const companyFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
});

const adminFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
});

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      email: "",
      password: "",
      companyName: "",
    },
  });

  const adminForm = useForm<z.infer<typeof adminFormSchema>>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
    },
  });

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if user is admin
    const checkAdmin = async () => {
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (adminError || !adminData) {
        router.push("/");
        return;
      }

      fetchData();
    };

    checkAdmin();
  }, [user, router]);

  const fetchData = async () => {
    // Fetch companies
    const { data: companiesData } = await supabase
      .from("companies")
      .select("*, admin:profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (companiesData) {
      setCompanies(companiesData);
    }

    // Fetch admins
    const { data: adminsData } = await supabase
      .from("admins")
      .select("*, user:profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (adminsData) {
      setAdmins(adminsData);
    }
  };

  const onCompanySubmit = async (values: z.infer<typeof companyFormSchema>) => {
    setLoading(true);
    try {
      // Create company admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create company profile
        const { error: companyError } = await supabase.from("companies").insert([
          {
            name: values.companyName,
            admin_id: authData.user.id,
          },
        ]);

        if (companyError) throw companyError;

        // Create admin profile
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            email: values.email,
            full_name: values.companyName + " Admin",
          },
        ]);

        if (profileError) throw profileError;

        toast({
          title: "Company created",
          description: "Company account has been created successfully.",
        });

        companyForm.reset();
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create company account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onAdminSubmit = async (values: z.infer<typeof adminFormSchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_admin_user", {
        email: values.email,
        full_name: values.fullName,
      });

      if (error) throw error;

      toast({
        title: "Admin created",
        description: "Admin user has been created successfully.",
      });

      adminForm.reset();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage company accounts and system access
            </p>
          </div>
        </div>

        <Tabs defaultValue="companies">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Company Account</CardTitle>
                <CardDescription>
                  Create credentials for a new company to access their dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...companyForm}>
                  <form
                    onSubmit={companyForm.handleSubmit(onCompanySubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@company.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? "Creating..." : "Create Company Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Companies</CardTitle>
                <CardDescription>List of all registered companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.map((company) => (
                    <Card key={company.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {company.logo_url ? (
                              <img
                                src={company.logo_url}
                                alt={company.name}
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <Building className="h-10 w-10 text-muted-foreground" />
                            )}
                            <div>
                              <h3 className="font-semibold">{company.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Admin: {company.admin?.email}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Admin User</CardTitle>
                <CardDescription>
                  Add a new administrator to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...adminForm}>
                  <form
                    onSubmit={adminForm.handleSubmit(onAdminSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={adminForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={loading}>
                      <Shield className="h-4 w-4 mr-2" />
                      {loading ? "Creating..." : "Create Admin User"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Administrators</CardTitle>
                <CardDescription>
                  List of all system administrators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <Card key={admin.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Shield className="h-10 w-10 text-primary" />
                            <div>
                              <h3 className="font-semibold">
                                {admin.user?.full_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {admin.user?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}