/*
  # Initial Schema Setup for JobMatch

  1. Tables Created:
    - profiles (user profiles with public/anonymous info)
    - companies (company information)
    - job_listings (job postings)
    - applications (job applications)
    - threads (community discussions)
    - comments (discussion replies)
    - system_admins (system administrators)
    - likes (for threads and comments)
    - swipes (job swipe actions)

  2. Security:
    - Row Level Security (RLS) enabled on all tables
    - Appropriate policies for each table
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  location text,
  bio text,
  resume_url text,
  avatar_url text,
  anonymous_name text,
  anonymous_bio text,
  anonymous_avatar_url text,
  title text,
  years_of_experience integer,
  skills text[],
  education text[],
  work_history jsonb[],
  anonymous_title text,
  anonymous_years_of_experience text,
  anonymous_skills text[],
  anonymous_education text[],
  anonymous_work_history jsonb[],
  job_types text[],
  desired_salary_range jsonb,
  remote_preference text,
  is_actively_looking boolean DEFAULT true
);

-- Create system_admins table
CREATE TABLE IF NOT EXISTS system_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  admin_id uuid REFERENCES auth.users(id),
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
  culture text
);

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  job_id uuid REFERENCES job_listings(id),
  user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  cover_letter text,
  notes text
);

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  tags text[],
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  view_count integer DEFAULT 0
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  thread_id uuid REFERENCES threads(id),
  author_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  parent_id uuid REFERENCES comments(id),
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  thread_id uuid REFERENCES threads(id),
  comment_id uuid REFERENCES comments(id),
  CONSTRAINT likes_target_check CHECK (
    (thread_id IS NOT NULL AND comment_id IS NULL) OR
    (thread_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Create swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  job_id uuid REFERENCES job_listings(id),
  direction text NOT NULL CHECK (direction IN ('left', 'right')),
  UNIQUE(user_id, job_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Companies policies
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  USING (auth.uid() = admin_id);

-- Job listings policies
CREATE POLICY "Active jobs are viewable by everyone"
  ON job_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Company admins can manage job listings"
  ON job_listings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = job_listings.company_id
    AND companies.admin_id = auth.uid()
  ));

-- Applications policies
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company admins can view applications for their jobs"
  ON applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM job_listings
    JOIN companies ON companies.id = job_listings.company_id
    WHERE job_listings.id = applications.job_id
    AND companies.admin_id = auth.uid()
  ));

-- Threads policies
CREATE POLICY "Threads are viewable by everyone"
  ON threads FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create threads"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own threads"
  ON threads FOR UPDATE
  USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Likes policies
CREATE POLICY "Users can view all likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON likes FOR ALL
  USING (auth.uid() = user_id);

-- Swipes policies
CREATE POLICY "Users can view own swipes"
  ON swipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create swipes"
  ON swipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System admins policies
CREATE POLICY "System admins info viewable by authenticated users"
  ON system_admins FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create functions

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, anonymous_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'Anonymous' || floor(random() * 10000)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update profile timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();