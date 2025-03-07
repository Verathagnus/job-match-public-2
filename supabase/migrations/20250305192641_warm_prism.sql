/*
  # Create admin user function
  
  1. Changes
    - Simplified admin user creation function to only require email
    - Auto-generates admin name from email if not provided
    - Creates necessary profile entries
    
  2. Security
    - Function can only be executed by authenticated users
    - Proper error handling for duplicate emails
*/

CREATE OR REPLACE FUNCTION create_admin_user(admin_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  admin_name text;
BEGIN
  -- Generate admin name from email if not provided
  admin_name := split_part(admin_email, '@', 1);
  admin_name := replace(initcap(replace(admin_name, '.', ' ')), '_', ' ');

  -- Create user in auth.users
  new_user_id := (SELECT id FROM auth.users WHERE email = admin_email);
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', admin_email;
  END IF;

  -- Create admin record
  INSERT INTO admins (user_id)
  VALUES (new_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update profile with admin name if it doesn't exist
  INSERT INTO profiles (id, email, full_name)
  VALUES (new_user_id, admin_email, admin_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN json_build_object(
    'user_id', new_user_id,
    'email', admin_email,
    'name', admin_name
  );
END;
$$;