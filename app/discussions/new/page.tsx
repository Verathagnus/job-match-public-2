'use client';

import { useState } from 'react';
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
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  content: z.string().min(20, {
    message: 'Content must be at least 20 characters.',
  }),
  is_anonymous: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

export default function NewThreadPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      is_anonymous: true,
      tags: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create a discussion thread.',
        variant: 'destructive',
      });
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('threads')
        .insert({
          author_id: user.id,
          title: values.title,
          content: values.content,
          is_anonymous: values.is_anonymous,
          tags: values.tags,
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Thread created',
        description: 'Your discussion thread has been posted successfully.',
      });

      router.push(`/discussions/${data[0].id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to create thread. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;

    const currentTags = form.getValues('tags') || [];
    if (currentTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }

    form.setValue('tags', [...currentTags, newTag.trim()]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue(
      'tags',
      currentTags.filter((t) => t !== tag)
    );
  };

  if (!user) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to create a discussion thread.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/auth/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Create New Discussion</h1>
          <Button variant="outline" onClick={() => router.push('/discussions')}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Thread</CardTitle>
            <CardDescription>
              Share your thoughts, questions, or experiences with the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a descriptive title"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Make your title clear and specific to attract relevant
                        responses.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your thoughts, questions, or experiences..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide enough details to help others understand your
                        discussion topic.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('tags')?.map((tag) => (
                      <Badge key={tag} className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag (e.g., Interviews, Salary)"
                      className="mr-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  <FormDescription className="mt-2">
                    Add relevant tags to help others find your discussion.
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="is_anonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Post Anonymously
                        </FormLabel>
                        <FormDescription>
                          When enabled, your anonymous profile will be used
                          instead of your real identity.
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

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Thread'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
