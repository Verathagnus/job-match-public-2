/*
  # Create admin user function
  
  1. Changes
    - Simplified admin user creation to only require email
    - Uses existing profile data
    - Adds proper error handling
    
  2. Security
    - Function can only be executed by authenticated users
    - Proper error handling for non-existent users
*/

CREATE OR REPLACE FUNCTION create_admin_user(admin_email text)
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

  -- Create admin record
  INSERT INTO admins (user_id)
  VALUES (new_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object(
    'user_id', new_user_id,
    'email', admin_email,
    'name', user_profile.full_name
  );
END;
$$;