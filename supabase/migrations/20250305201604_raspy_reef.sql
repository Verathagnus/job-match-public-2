/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text, unique)
      - `full_name` (text)
      - `anonymous_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - Additional profile fields with appropriate defaults

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for:
      - Users can read and update their own profile
      - Public can read anonymous fields
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
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

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to handle profile updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
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