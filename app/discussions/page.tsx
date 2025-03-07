"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Thread } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ThumbsUp, Eye, Clock, Plus, Search } from "lucide-react";

export default function DiscussionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchThreads();
  }, [activeTab]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("threads")
        .select(`
          *,
          author:profiles(*)
        `)
        .order("created_at", { ascending: false });

      if (activeTab === "my-threads" && user) {
        query = query.eq("author_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchThreads();
      return;
    }

    const filteredThreads = threads.filter(
      (thread) =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (thread.tags && thread.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    setThreads(filteredThreads);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="container py-8 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community Discussions</h1>
          <p className="text-muted-foreground">
            Join conversations about companies, interviews, and career advice
          </p>
        </div>
        <Link href="/discussions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="cursor-pointer">
                  Interviews
                </Badge>
                <Badge variant="secondary" className="cursor-pointer">
                  Salary
                </Badge>
                <Badge variant="secondary" className="cursor-pointer">
                  Remote Work
                </Badge>
                <Badge variant="secondary" className="cursor-pointer">
                  Startups
                </Badge>
                <Badge variant="secondary" className="cursor-pointer">
                  Career Advice
                </Badge>
                <Badge variant="secondary" className="cursor-pointer">
                  Tech Stack
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Discussions</TabsTrigger>
              <TabsTrigger value="my-threads">My Threads</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : threads.length > 0 ? (
            <div className="space-y-4">
              {threads.map((thread) => {
                const author = thread.author as any;
                const isAnonymous = thread.is_anonymous;
                const displayName = isAnonymous
                  ? author?.anonymous_name || "Anonymous User"
                  : author?.full_name || "Unknown User";
                const avatarUrl = isAnonymous
                  ? author?.anonymous_avatar_url
                  : author?.avatar_url;

                return (
                  <Card key={thread.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <Link href={`/discussions/${thread.id}`} className="hover:underline">
                          <CardTitle>{thread.title}</CardTitle>
                        </Link>
                        {thread.is_anonymous && (
                          <Badge variant="outline" className="ml-2">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {thread.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="line-clamp-2 text-muted-foreground">
                        {thread.content}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={avatarUrl || ""} alt={displayName} />
                            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{displayName}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatDate(thread.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          <span>{thread.upvotes}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{thread.view_count}</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No discussions found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "my-threads"
                    ? "You haven't created any threads yet."
                    : "No discussions match your search criteria."}
                </p>
                <Link href="/discussions/new">
                  <Button>Start a New Discussion</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}