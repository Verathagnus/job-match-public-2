/*
  # Fix Registration Policies

  1. Changes
    - Add policies to allow public profile creation during registration
    - Update existing policies to handle new user registration flow
    - Ensure proper access control while maintaining security

  2. Security
    - Maintain RLS protection for existing data
    - Allow only necessary operations for registration
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow public profile creation" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies for profile creation
CREATE POLICY "Enable read access for all users"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authentication"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update trigger function to handle profile creation
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