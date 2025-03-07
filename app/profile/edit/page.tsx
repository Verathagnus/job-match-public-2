'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const formSchema = z.object({
  full_name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  title: z.string().optional(),
  years_of_experience: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  anonymous_name: z.string().optional(),
  anonymous_bio: z.string().optional(),
  anonymous_title: z.string().optional(),
  anonymous_skills: z.array(z.string()).optional(),
  anonymous_education: z.array(z.string()).optional(),
  is_actively_looking: z.boolean().default(true),
});

export default function EditProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newEducation, setNewEducation] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      title: '',
      years_of_experience: 0,
      skills: [],
      education: [],
      anonymous_name: '',
      anonymous_bio: '',
      anonymous_title: '',
      anonymous_skills: [],
      anonymous_education: [],
      is_actively_looking: true,
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        title: profile.title || '',
        years_of_experience: profile.years_of_experience || 0,
        skills: profile.skills || [],
        education: profile.education || [],
        anonymous_name: profile.anonymous_name || '',
        anonymous_bio: profile.anonymous_bio || '',
        anonymous_title: profile.anonymous_title || '',
        anonymous_skills: profile.anonymous_skills || [],
        anonymous_education: profile.anonymous_education || [],
        is_actively_looking: profile.is_actively_looking ?? true,
      });
    }
  }, [user, profile, form, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      router.push('/profile');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const currentSkills = form.getValues('skills') || [];
    if (currentSkills.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }
    form.setValue('skills', [...currentSkills, newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues('skills') || [];
    form.setValue(
      'skills',
      currentSkills.filter((s) => s !== skill)
    );
  };

  const addEducation = () => {
    if (!newEducation.trim()) return;
    const currentEducation = form.getValues('education') || [];
    form.setValue('education', [...currentEducation, newEducation.trim()]);
    setNewEducation('');
  };

  const removeEducation = (education: string) => {
    const currentEducation = form.getValues('education') || [];
    form.setValue(
      'education',
      currentEducation.filter((e) => e !== education)
    );
  };

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

  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Button variant="outline" onClick={() => router.push('/profile')}>
            Cancel
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>
                  This information will be visible to companies when you apply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} />
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
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself"
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Senior Software Engineer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="years_of_experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Skills</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('skills')?.map((skill) => (
                      <Badge key={skill} className="flex items-center gap-1">
                        {skill}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeSkill(skill)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      className="mr-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSkill}>
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <FormLabel>Education</FormLabel>
                  <div className="flex flex-col gap-2 mt-2">
                    {form.watch('education')?.map((education) => (
                      <div
                        key={education}
                        className="flex items-center justify-between bg-secondary p-2 rounded-md"
                      >
                        <span>{education}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEducation(education)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <Input
                      value={newEducation}
                      onChange={(e) => setNewEducation(e.target.value)}
                      placeholder="Add education"
                      className="mr-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEducation();
                        }
                      }}
                    />
                    <Button type="button" onClick={addEducation}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anonymous Profile</CardTitle>
                <CardDescription>
                  This information will be shown when applying anonymously.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="anonymous_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anonymous Name</FormLabel>
                      <FormControl>
                        <Input disabled {...field} />
                      </FormControl>
                      <FormDescription>
                        This is automatically generated to protect your identity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="anonymous_bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anonymous Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe yourself without revealing personal details"
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
                  name="anonymous_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anonymous Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Professional Title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
                <CardDescription>
                  Set your preferences for job matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="is_actively_looking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Actively Looking
                        </FormLabel>
                        <FormDescription>
                          Show your profile to companies and receive job matches
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}