/*
  # Initial Seed Data
  
  Populates the database with:
  1. Sample companies
  2. Job listings
  3. Discussion threads
*/

-- Seed Companies
INSERT INTO companies (
  id,
  name,
  industry,
  size,
  location,
  description,
  logo_url,
  benefits,
  culture
) VALUES (
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'TechCorp',
  'Technology',
  'Medium',
  'San Francisco, CA',
  'Leading technology company focused on innovation and creating cutting-edge solutions.',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
  ARRAY['Health Insurance', 'Remote Work', '401k', 'Unlimited PTO'],
  'We believe in fostering innovation through collaboration and continuous learning.'
), (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'FinanceHub',
  'Finance',
  'Large',
  'New York, NY',
  'Global financial services company providing innovative solutions.',
  'https://images.unsplash.com/photo-1554774853-719586f82d77',
  ARRAY['Stock Options', 'Flexible Hours', 'Gym Membership'],
  'Driven by excellence and committed to delivering value to our clients.'
);

-- Seed Job Listings
INSERT INTO job_listings (
  id,
  company_id,
  title,
  description,
  location,
  is_remote,
  job_type,
  skills_required,
  experience_level,
  is_active
) VALUES (
  'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Senior Software Engineer',
  'Looking for an experienced software engineer to join our team and help build scalable solutions.',
  'San Francisco, CA',
  true,
  'Full-time',
  ARRAY['JavaScript', 'React', 'Node.js', 'AWS'],
  'Senior',
  true
), (
  'j2eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'Product Manager',
  'Lead product strategy and development for our core financial products.',
  'New York, NY',
  false,
  'Full-time',
  ARRAY['Product Management', 'Agile', 'Financial Services'],
  'Mid-Level',
  true
);

-- Seed Threads
INSERT INTO threads (
  id,
  title,
  content,
  is_anonymous,
  tags,
  upvotes,
  view_count
) VALUES (
  't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'Tips for Remote Job Interviews',
  'Share your experiences and tips for successful remote job interviews.',
  true,
  ARRAY['Remote Work', 'Interviews', 'Career Advice'],
  5,
  100
), (
  't2eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  'Salary Negotiations in Tech',
  'How to effectively negotiate your salary in the tech industry.',
  true,
  ARRAY['Salary', 'Negotiation', 'Tech Industry'],
  10,
  200
);