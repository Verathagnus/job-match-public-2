'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { JobListing } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, Building, X, Check, Clock } from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchJobs = async () => {
      try {
        // Get jobs that the user hasn't swiped on yet
        const { data: swipedJobIds } = await supabase
          .from('swipes')
          .select('job_id')
          .eq('user_id', user.id);

        const swipedIds = swipedJobIds?.map((swipe) => swipe.job_id) || [];

        // Fetch jobs with company information
        const { data: jobsData, error } = await supabase
          .from('job_listings')
          .select(
            `
            *,
            company:companies(*)
          `
          )
          .eq('is_active', true)
          .not('id', 'in', `(${swipedIds.join(',')})`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setJobs(jobsData || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user, router]);

  const handleSwipe = async (
    jobId: string,
    swipeDirection: 'left' | 'right'
  ) => {
    if (swiping) return;

    setSwiping(true);
    setDirection(swipeDirection);

    try {
      // Record the swipe
      const { error } = await supabase.from('swipes').insert({
        user_id: user?.id,
        job_id: jobId,
        direction: swipeDirection,
      });

      if (error) throw error;

      // If swiped right, show success message
      if (swipeDirection === 'right') {
        toast({
          title: 'Application submitted!',
          description: 'Your profile has been sent to the company.',
        });
      }

      // Wait for animation to complete
      setTimeout(() => {
        setCurrentJobIndex((prevIndex) => prevIndex + 1);
        setDirection(null);
        setSwiping(false);
        setDragOffset({ x: 0, y: 0 });
      }, 300);
    } catch (error) {
      console.error('Error recording swipe:', error);
      setSwiping(false);
      setDirection(null);
      setDragOffset({ x: 0, y: 0 });

      toast({
        title: 'Error',
        description: 'Failed to process your action. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (swiping) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (swiping) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    if (swiping) return;

    const threshold = 100; // Minimum drag distance to trigger a swipe

    if (dragOffset.x > threshold) {
      // Swiped right
      handleSwipe(jobs[currentJobIndex].id, 'right');
    } else if (dragOffset.x < -threshold) {
      // Swiped left
      handleSwipe(jobs[currentJobIndex].id, 'left');
    } else {
      // Reset if not enough drag distance
      setDragOffset({ x: 0, y: 0 });
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] mx-auto">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0 || currentJobIndex >= jobs.length) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center mx-auto">
        <Building className="h-16 w-16 mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">No more jobs to show</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          You've seen all available job listings. Check back later for new
          opportunities!
        </p>
        <div className="flex gap-4">
          <Link href="/companies">
            <Button variant="outline">Browse Companies</Button>
          </Link>
          <Link href="/discussions">
            <Button>Join Discussions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentJob = jobs[currentJobIndex];
  const company = currentJob.company as any;
  const rotationAngle = dragOffset.x * 0.1; // Rotate based on drag distance
  const opacity = 1 - Math.min(1, Math.abs(dragOffset.x) / 400);

  return (
    <div className="container py-8 flex flex-col items-center min-h-[calc(100vh-4rem)] mx-auto">
      <div className="w-full max-w-md mx-auto mb-8">
        <h1 className="text-2xl font-bold text-center mb-2">Find Your Match</h1>
        <p className="text-center text-muted-foreground">
          Swipe right to apply, left to pass
        </p>
      </div>

      <div className="relative w-full max-w-md h-[500px] mx-auto">
        <AnimatePresence>
          <motion.div
            key={currentJob.id}
            className="absolute w-full h-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: opacity,
              rotateZ: rotationAngle,
              x: dragOffset.x,
              y: dragOffset.y,
            }}
            exit={{
              x: direction === 'left' ? -500 : direction === 'right' ? 500 : 0,
              opacity: 0,
              rotateZ:
                direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
            }}
            transition={{ type: 'spring', damping: 15 }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <Card className="w-full h-full overflow-hidden shadow-lg">
              {company?.logo_url && (
                <div className="h-40 bg-muted flex items-center justify-center p-4">
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{currentJob.title}</h2>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{company?.name}</span>
                  </div>
                  {currentJob.location && (
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{currentJob.location}</span>
                      {currentJob.is_remote && (
                        <span className="ml-2">(Remote Available)</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span>{currentJob.job_type || 'Full-time'}</span>
                  </div>
                  {currentJob.application_deadline && (
                    <div className="flex items-center text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        Deadline:{' '}
                        {new Date(
                          currentJob.application_deadline
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold mb-1">About the role</h3>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {currentJob.description}
                  </p>
                </div>

                {currentJob.skills_required &&
                  currentJob.skills_required.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-1">Skills</h3>
                      <div className="flex flex-wrap gap-1">
                        {currentJob.skills_required
                          .slice(0, 5)
                          .map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        {currentJob.skills_required.length > 5 && (
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                            +{currentJob.skills_required.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleSwipe(currentJob.id, 'left')}
                    disabled={swiping}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSwipe(currentJob.id, 'right')}
                    disabled={swiping}
                  >
                    <Check className="h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Swipe indicators */}
            {dragOffset.x > 50 && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full font-bold transform rotate-12">
                APPLY
              </div>
            )}
            {dragOffset.x < -50 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold transform -rotate-12">
                PASS
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Job {currentJobIndex + 1} of {jobs.length}
        </p>
      </div>
    </div>
  );
}
