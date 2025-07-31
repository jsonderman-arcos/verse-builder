/*
  # Create First Admin User

  This migration creates the first admin user. 
  Replace 'your-email@example.com' with the actual email address 
  of the user who should have admin privileges.
  
  Run this after the user has signed up for an account.
*/

-- Insert first admin user (replace with actual email)
-- This should be run manually after the target user has created their account
INSERT INTO admin_users (user_id, permissions, granted_by)
SELECT 
  id,
  '{"manage_users": true, "view_analytics": true, "system_admin": true}'::jsonb,
  id -- Self-granted for first admin
FROM auth.users 
WHERE email = 'jason@blue148.com' -- REPLACE WITH ACTUAL EMAIL
AND NOT EXISTS (
  SELECT 1 FROM admin_users WHERE user_id = auth.users.id
);

-- Note: This migration will only work if:
-- 1. The user with the specified email has already signed up
-- 2. They haven't already been made an admin
-- 3. You replace 'your-email@example.com' with the actual email