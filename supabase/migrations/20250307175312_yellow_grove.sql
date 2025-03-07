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
  'Leading technology company focused on innovation',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
  ARRAY['Health Insurance', 'Remote Work', '401k', 'Unlimited PTO'],
  'We believe in fostering innovation through collaboration'
);

-- Seed Job Listings
INSERT INTO job_listings (
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
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Senior Software Engineer',
  'Looking for an experienced software engineer to join our team',
  'San Francisco, CA',
  true,
  'Full-time',
  ARRAY['JavaScript', 'React', 'Node.js', 'AWS'],
  'Senior',
  true
);