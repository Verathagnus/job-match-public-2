/*
  # Initial Database Schema for JobMatch Platform

  1. Tables
    - profiles: User profiles with public and anonymous information
    - companies: Company information and details
    - admins: System administrators
    - job_listings: Job postings from companies
    - applications: Job applications from users
    - threads: Community discussion threads
    - comments: Comments on discussion threads
    - swipes: User job swipes (left/right)

  2. Security
    - RLS enabled on all tables
    - Policies for user access control
    - Admin management functionality
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  full_name text,
  email text UNIQUE,
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

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
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

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Job listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
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

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cover_letter text,
  status text DEFAULT 'pending',
  notes text
);

-- Discussion threads table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  tags text[],
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  view_count integer DEFAULT 0
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0
);

-- Swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE NOT NULL,
  direction text NOT NULL CHECK (direction IN ('left', 'right'))
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admins
    WHERE admins.user_id = is_admin.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin users
CREATE OR REPLACE FUNCTION create_admin_user(
  email text,
  full_name text
)
RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Get existing user ID
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE auth.users.email = create_admin_user.email;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', email;
  END IF;

  -- Create admin record
  INSERT INTO admins (user_id)
  VALUES (new_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update profile if needed
  INSERT INTO profiles (id, email, full_name)
  VALUES (new_user_id, email, full_name)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Companies
CREATE POLICY "Anyone can view companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Company admins can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (admin_id = auth.uid() OR is_admin(auth.uid()));

-- Admins
CREATE POLICY "Admins can view all admin records"
  ON admins
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert new admins"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Job Listings
CREATE POLICY "Anyone can view active job listings"
  ON job_listings
  FOR SELECT
  TO authenticated
  USING (is_active = true OR company_id IN (
    SELECT id FROM companies WHERE admin_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage their job listings"
  ON job_listings
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- Applications
CREATE POLICY "Users can view their own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    job_id IN (
      SELECT id FROM job_listings 
      WHERE company_id IN (
        SELECT id FROM companies WHERE admin_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Threads
CREATE POLICY "Anyone can view threads"
  ON threads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create threads"
  ON threads
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their threads"
  ON threads
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Comments
CREATE POLICY "Anyone can view comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Swipes
CREATE POLICY "Users can view their own swipes"
  ON swipes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create swipes"
  ON swipes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  EXCEPTION
      WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_companies_updated_at
      BEFORE UPDATE ON companies
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  EXCEPTION
      WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_job_listings_updated_at
      BEFORE UPDATE ON job_listings
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  EXCEPTION
      WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_applications_updated_at
      BEFORE UPDATE ON applications
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  EXCEPTION
      WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_threads_updated_at
      BEFORE UPDATE ON threads
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  EXCEPTION
      WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_comments_updated_at
      BEFORE UPDATE ON comments
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  EXCEPTION
      WHEN duplicate_object THEN null;
END $$;