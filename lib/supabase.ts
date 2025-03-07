import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  resume_url?: string;
  avatar_url?: string;
  anonymous_name?: string;
  anonymous_bio?: string;
  anonymous_avatar_url?: string;
  title?: string;
  years_of_experience?: number;
  skills?: string[];
  education?: string[];
  work_history?: any[];
  anonymous_title?: string;
  anonymous_years_of_experience?: string;
  anonymous_skills?: string[];
  anonymous_education?: string[];
  anonymous_work_history?: any[];
  job_types?: string[];
  desired_salary_range?: any;
  remote_preference?: string;
  is_actively_looking?: boolean;
};

export type Company = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  founded_year?: number;
  location?: string;
  description?: string;
  mission?: string;
  benefits?: string[];
  culture?: string;
  admin_id?: string;
};

export type JobListing = {
  id: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  title: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  location?: string;
  is_remote?: boolean;
  job_type?: string;
  salary_range?: any;
  skills_required?: string[];
  experience_level?: string;
  education_required?: string;
  benefits?: string[];
  application_deadline?: string;
  is_active?: boolean;
  company?: Company;
};

export type Application = {
  id: string;
  created_at: string;
  updated_at: string;
  job_id: string;
  user_id: string;
  cover_letter?: string;
  status: string;
  notes?: string;
  job?: JobListing;
};

export type Thread = {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  tags?: string[];
  upvotes: number;
  downvotes: number;
  view_count: number;
  author?: Profile;
};

export type Comment = {
  id: string;
  created_at: string;
  updated_at: string;
  thread_id: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  parent_id?: string;
  upvotes: number;
  downvotes: number;
  author?: Profile;
  replies?: Comment[];
};

export type Like = {
  id: string;
  created_at: string;
  user_id: string;
  thread_id?: string;
  comment_id?: string;
};

export type Swipe = {
  id: string;
  created_at: string;
  user_id: string;
  job_id: string;
  direction: 'left' | 'right';
};