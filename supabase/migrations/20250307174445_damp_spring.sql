/*
  # JobMatch Database Seed Data

  1. Initial Data
    - System admin user
    - Sample companies with admins
    - Regular users with complete profiles
    - Job listings
    - Applications
    - Community discussions
*/

-- Create initial system admin
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@jobmatch.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"full_name": "System Administrator"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, anonymous_name)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@jobmatch.com',
  'System Administrator',
  'AdminUser123'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO system_admins (id)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT (id) DO NOTHING;

-- Create company admin users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES 
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@techcorp.com',
    crypt('company123', gen_salt('bf')),
    now(),
    '{"full_name": "TechCorp Admin"}'
  ),
  (
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@innovatelabs.com',
    crypt('company123', gen_salt('bf')),
    now(),
    '{"full_name": "InnovateLabs Admin"}'
  ) ON CONFLICT (id) DO NOTHING;

-- Create company admin profiles
INSERT INTO profiles (id, email, full_name, anonymous_name)
VALUES 
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@techcorp.com',
    'TechCorp Admin',
    'TechAdmin123'
  ),
  (
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@innovatelabs.com',
    'InnovateLabs Admin',
    'InnovateAdmin123'
  ) ON CONFLICT (id) DO NOTHING;

-- Create sample companies
INSERT INTO companies (
  id,
  admin_id,
  name,
  logo_url,
  website,
  industry,
  size,
  founded_year,
  location,
  description,
  mission,
  benefits,
  culture
) VALUES
  (
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'TechCorp Solutions',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    'https://techcorp.example.com',
    'Technology',
    'Medium',
    2015,
    'San Francisco, CA',
    'TechCorp Solutions is a leading provider of enterprise software solutions, specializing in cloud computing and artificial intelligence.',
    'To transform businesses through innovative technology solutions.',
    ARRAY['Health Insurance', 'Remote Work', '401(k) Match', 'Professional Development'],
    'We foster a culture of innovation, collaboration, and continuous learning.'
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'InnovateLabs',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop',
    'https://innovatelabs.example.com',
    'Software',
    'Small',
    2019,
    'Austin, TX',
    'InnovateLabs is a startup focused on developing cutting-edge mobile applications and web platforms.',
    'To create technology that makes life better for everyone.',
    ARRAY['Flexible Hours', 'Stock Options', 'Unlimited PTO', 'Gym Membership'],
    'We believe in empowering our employees to take ownership and make an impact.'
  ) ON CONFLICT (id) DO NOTHING;

-- Create regular user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'john.doe@example.com',
  crypt('user123', gen_salt('bf')),
  now(),
  '{"full_name": "John Doe"}'
) ON CONFLICT (id) DO NOTHING;

-- Create complete user profile
INSERT INTO profiles (
  id,
  email,
  full_name,
  phone,
  location,
  bio,
  resume_url,
  avatar_url,
  anonymous_name,
  anonymous_bio,
  anonymous_avatar_url,
  title,
  years_of_experience,
  skills,
  education,
  work_history,
  anonymous_title,
  anonymous_years_of_experience,
  anonymous_skills,
  anonymous_education,
  anonymous_work_history,
  job_types,
  desired_salary_range,
  remote_preference,
  is_actively_looking
) VALUES (
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'john.doe@example.com',
  'John Doe',
  '+1 (555) 123-4567',
  'New York, NY',
  'Passionate software engineer with expertise in full-stack development and cloud technologies.',
  'https://example.com/resume.pdf',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  'Anonymous7249',
  'Experienced developer passionate about creating impactful solutions.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'Senior Software Engineer',
  8,
  ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS'],
  ARRAY['BS Computer Science, Stanford University', 'MS Software Engineering, MIT'],
  ARRAY[
    '{"company": "Tech Giants Inc", "title": "Senior Software Engineer", "period": "2019-2023", "description": "Led development of cloud-native applications"}',
    '{"company": "StartupCo", "title": "Full Stack Developer", "period": "2015-2019", "description": "Built and scaled multiple web applications"}'
  ]::jsonb[],
  'Senior Developer',
  '8+ years',
  ARRAY['Frontend Development', 'Backend Development', 'Cloud Architecture'],
  ARRAY['Computer Science Degree', 'Multiple Technical Certifications'],
  ARRAY[
    '{"role": "Senior Developer", "duration": "4+ years", "description": "Led development teams and architected solutions"}',
    '{"role": "Developer", "duration": "4 years", "description": "Full stack development and system design"}'
  ]::jsonb[],
  ARRAY['Full-time', 'Remote'],
  '{"min": 120000, "max": 180000, "currency": "USD"}'::jsonb,
  'Remote Only',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create job listings
INSERT INTO job_listings (
  id,
  company_id,
  title,
  description,
  requirements,
  responsibilities,
  location,
  is_remote,
  job_type,
  salary_range,
  skills_required,
  experience_level,
  education_required,
  benefits,
  application_deadline,
  is_active
) VALUES (
  'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Senior Full Stack Developer',
  'Join our team to build next-generation web applications using cutting-edge technologies.',
  ARRAY['5+ years of experience with modern JavaScript frameworks', 'Strong understanding of cloud technologies', 'Experience with microservices architecture'],
  ARRAY['Lead development of new features', 'Mentor junior developers', 'Architect scalable solutions'],
  'San Francisco, CA',
  true,
  'Full-time',
  '{"min": 140000, "max": 200000, "currency": "USD"}'::jsonb,
  ARRAY['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
  'Senior',
  'Bachelor''s degree in Computer Science or related field',
  ARRAY['Health Insurance', 'Remote Work', '401(k)', 'Unlimited PTO'],
  (now() + interval '30 days')::date,
  true
) ON CONFLICT (id) DO NOTHING;

-- Create application
INSERT INTO applications (
  id,
  job_id,
  user_id,
  status,
  cover_letter,
  notes
) VALUES (
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'pending',
  'I am excited to apply for this position and believe my skills and experience make me an ideal candidate.',
  'Strong technical background and culture fit'
) ON CONFLICT (id) DO NOTHING;