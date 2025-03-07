/*
  # Initial Database Schema Setup

  1. Tables Created:
    - profiles
    - companies
    - job_listings
    - applications
    - swipes
    - threads
    - comments

  2. Security:
    - RLS enabled on all tables
    - Appropriate policies for each table
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  full_name text,
  email text UNIQUE,
  phone text,
  location text,
  bio text,
  title text,
  years_of_experience integer,
  skills text[],
  education text[],
  work_history jsonb[],
  resume_url text,
  avatar_url text,
  anonymous_name text,
  anonymous_bio text,
  anonymous_title text,
  anonymous_skills text[],
  anonymous_education text[],
  anonymous_work_history jsonb[],
  anonymous_avatar_url text,
  is_actively_looking boolean DEFAULT true
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  logo_url text,
  website text,
  industry text,
  size text,
  founded_year integer,
  location text,
  description text,
  mission text,
  benefits text[],
  culture text,
  admin_id uuid REFERENCES auth.users ON DELETE SET NULL
);

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  requirements text[],
  responsibilities text[],
  location text,
  is_remote boolean DEFAULT false,
  job_type text,
  salary_range jsonb,
  skills_required text[],
  experience_level text,
  education_required text,
  benefits text[],
  application_deadline timestamptz,
  is_active boolean DEFAULT true
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  job_id uuid REFERENCES job_listings ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  status text DEFAULT 'pending',
  notes text
);

-- Create swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  job_id uuid REFERENCES job_listings ON DELETE CASCADE,
  direction text NOT NULL,
  UNIQUE(user_id, job_id)
);

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  tags text[],
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  view_count integer DEFAULT 0
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  thread_id uuid REFERENCES threads ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users ON DELETE CASCADE,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  parent_id uuid REFERENCES comments ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Companies
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = admin_id);

CREATE POLICY "Company admins can delete their company"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = admin_id);

-- Job Listings
CREATE POLICY "Anyone can view active job listings"
  ON job_listings FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Company admins can manage their job listings"
  ON job_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = job_listings.company_id
      AND companies.admin_id = auth.uid()
    )
  );

-- Applications
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Swipes
CREATE POLICY "Users can view their own swipes"
  ON swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create swipes"
  ON swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Threads
CREATE POLICY "Anyone can view threads"
  ON threads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create threads"
  ON threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their threads"
  ON threads FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Comments
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);