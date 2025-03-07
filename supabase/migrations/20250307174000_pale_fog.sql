/*
  # Fix Profile Creation Trigger

  1. Changes
    - Update handle_new_user trigger to handle existing profiles
    - Add ON CONFLICT clause to prevent duplicate profile creation
    - Maintain existing profile data if present

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during profile creation
*/

-- Update the handle_new_user function to handle existing profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    anonymous_name
  )
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous User'),
    'Anonymous' || floor(random() * 10000)::text
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();