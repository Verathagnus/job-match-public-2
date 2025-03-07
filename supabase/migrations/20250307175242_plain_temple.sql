/*
  # JobMatch Database Schema

  1. Tables Created:
    - profiles - User profiles with public and anonymous information
    - companies - Company information and details
    - job_listings - Job postings from companies
    - applications - Job applications from users
    - threads - Community discussion threads
    - comments - Comments on discussion threads
    - swipes - User swipes on job listings

  2. Security:
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Set up foreign key relationships
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
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
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  notes text
);

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0
);

-- Create swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE,
  direction text CHECK (direction IN ('left', 'right')),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Companies policies
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = admin_id);

-- Job listings policies
CREATE POLICY "Active job listings are viewable by everyone"
  ON job_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Company admins can manage job listings"
  ON job_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = job_listings.company_id
      AND companies.admin_id = auth.uid()
    )
  );

-- Applications policies
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.admin_id = auth.uid()
      AND companies.id = (
        SELECT company_id FROM job_listings WHERE id = applications.job_id
      )
    )
  );

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Threads policies
CREATE POLICY "Threads are viewable by everyone"
  ON threads FOR SELECT
  USING (true);

CREATE POLICY "Users can create threads"
  ON threads FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their threads"
  ON threads FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Swipes policies
CREATE POLICY "Users can view their own swipes"
  ON swipes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create swipes"
  ON swipes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to automatically create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, anonymous_name)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous User'),
    'Anonymous' || floor(random() * 10000)::text
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();