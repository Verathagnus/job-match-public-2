/*
  # Seed Data

  Initial seed data for:
  1. Companies
  2. Job Listings
  3. Sample Users
*/

-- Seed Companies
INSERT INTO companies (id, name, industry, size, location, description, logo_url, benefits)
VALUES
  (
    gen_random_uuid(),
    'TechCorp',
    'Technology',
    'Medium',
    'San Francisco, CA',
    'Leading technology company focused on innovation',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
    ARRAY['Health Insurance', 'Remote Work', '401k']
  ),
  (
    gen_random_uuid(),
    'FinanceHub',
    'Finance',
    'Large',
    'New York, NY',
    'Global financial services company',
    'https://images.unsplash.com/photo-1554774853-719586f82d77',
    ARRAY['Stock Options', 'Flexible Hours', 'Gym Membership']
  ),
  (
    gen_random_uuid(),
    'HealthTech',
    'Healthcare',
    'Small',
    'Boston, MA',
    'Healthcare technology solutions provider',
    'https://images.unsplash.com/photo-1550831107-1553da8c8464',
    ARRAY['Healthcare Benefits', 'Professional Development', 'Paid Time Off']
  );

-- Get company IDs for job listings
WITH company_ids AS (
  SELECT id FROM companies ORDER BY created_at DESC LIMIT 3
)
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
)
SELECT
  gen_random_uuid(),
  company_id,
  title,
  description,
  location,
  is_remote,
  job_type,
  skills,
  experience_level,
  true
FROM (
  SELECT
    id as company_id,
    unnest(ARRAY[
      'Senior Software Engineer',
      'Product Manager',
      'UX Designer'
    ]) as title,
    unnest(ARRAY[
      'Looking for an experienced software engineer to join our team',
      'Lead product strategy and development for our core products',
      'Design intuitive user experiences for our applications'
    ]) as description,
    unnest(ARRAY[
      'San Francisco, CA',
      'New York, NY',
      'Remote'
    ]) as location,
    unnest(ARRAY[
      true,
      false,
      true
    ]) as is_remote,
    unnest(ARRAY[
      'Full-time',
      'Full-time',
      'Contract'
    ]) as job_type,
    unnest(ARRAY[
      ARRAY['JavaScript'::text, 'React'::text, 'Node.js'::text],
      ARRAY['Product Management'::text, 'Agile'::text, 'Strategy'::text],
      ARRAY['UI/UX'::text, 'Figma'::text, 'User Research'::text]
    ]) as skills,
    unnest(ARRAY[
      'Senior',
      'Mid-Level',
      'Senior'
    ]) as experience_level
  FROM company_ids
) job_data;