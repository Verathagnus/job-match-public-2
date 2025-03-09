/*
  # JobMatch Database Schema

  1. Tables
    - `profiles` - User profiles with both public and anonymous information
    - `system_admins` - System administrators with full access
    - `company_admins` - Company administrators
    - `companies` - Company information and details
    - `job_listings` - Job postings from companies
    - `applications` - Job applications from users
    - `threads` - Community discussion threads
    - `comments` - Comments on discussion threads
    - `swipes` - User swipes on job listings

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Set up foreign key relationships
*/

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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- Create company_admins table
CREATE TABLE IF NOT EXISTS company_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(user_id, company_id)
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
  culture text
);

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  job_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter text,
  status text DEFAULT 'pending',
  notes text
);

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('left', 'right'))
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_admins_user_id ON system_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_company_admins_user_id ON company_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_company_admins_company_id ON company_admins(company_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_company_id ON job_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_job_id ON swipes(job_id);

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- System admins policies
CREATE POLICY "System admins are viewable by system admins"
  ON system_admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only system admins can manage system admins"
  ON system_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_admins WHERE user_id = auth.uid()
    )
  );

-- Company admins policies
CREATE POLICY "Company admins are viewable by system admins and company admins"
  ON company_admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_admins WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only system admins can manage company admins"
  ON company_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_admins WHERE user_id = auth.uid()
    )
  );

-- Companies policies
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "System admins can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_admins
      WHERE user_id = auth.uid()
      AND company_id = companies.id
    )
  );

-- Job listings policies
CREATE POLICY "Active job listings are viewable by everyone"
  ON job_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Company admins can manage their job listings"
  ON job_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_admins
      WHERE user_id = auth.uid()
      AND company_id = job_listings.company_id
    )
  );

-- Applications policies
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM company_admins
      WHERE user_id = auth.uid()
      AND company_id IN (
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

-- Create functions
CREATE OR REPLACE FUNCTION create_system_admin(admin_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  user_profile profiles;
BEGIN
  -- Get user ID and profile
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', admin_email;
  END IF;

  -- Get user profile
  SELECT * INTO user_profile 
  FROM profiles 
  WHERE id = new_user_id;

  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Profile for user % does not exist', admin_email;
  END IF;

  -- Create system admin record
  INSERT INTO system_admins (user_id)
  VALUES (new_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object(
    'user_id', new_user_id,
    'email', admin_email,
    'name', user_profile.full_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION create_company_admin(admin_email text, company_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  user_profile profiles;
  company_data companies;
BEGIN
  -- Get user ID and profile
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', admin_email;
  END IF;

  -- Get user profile
  SELECT * INTO user_profile 
  FROM profiles 
  WHERE id = new_user_id;

  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Profile for user % does not exist', admin_email;
  END IF;

  -- Get company
  SELECT * INTO company_data
  FROM companies
  WHERE id = company_id;

  IF company_data IS NULL THEN
    RAISE EXCEPTION 'Company with ID % does not exist', company_id;
  END IF;

  -- Create company admin record
  INSERT INTO company_admins (user_id, company_id)
  VALUES (new_user_id, company_id)
  ON CONFLICT (user_id, company_id) DO NOTHING;

  RETURN json_build_object(
    'user_id', new_user_id,
    'email', admin_email,
    'name', user_profile.full_name,
    'company_id', company_id,
    'company_name', company_data.name
  );
END;
$$;

-- Profile management policies
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow public profile creation"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Companies can read applicant profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_admins 
      WHERE user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM applications
        WHERE applications.user_id = profiles.id
        AND applications.job_id IN (
          SELECT id FROM job_listings
          WHERE company_id = company_admins.company_id
        )
      )
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_system_admins_updated_at
  BEFORE UPDATE ON system_admins
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_company_admins_updated_at
  BEFORE UPDATE ON company_admins
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

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

-- Trigger to call handle_new_user after signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();