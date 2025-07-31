@@ .. @@
 /*
   # Create First Admin User
   
   1. Admin Setup
     - Creates admin privileges for the specified user
     - Grants full system admin permissions
     - Sets up initial admin user after they sign up
   
   Note: This should be run after the user has signed up with their account
 */

 -- Grant admin privileges to the first admin user
 -- Replace 'your-email@example.com' with the actual admin email
 INSERT INTO admin_users (user_id, permissions, is_active)
 SELECT 
   id,
   '{"manage_users": true, "system_admin": true, "view_analytics": true}'::jsonb,
   true
 FROM auth.users 
-WHERE email = 'your-email@example.com'
+WHERE email = 'jason@blue148.com'
 ON CONFLICT (user_id) DO UPDATE SET
   permissions = EXCLUDED.permissions,
   is_active = EXCLUDED.is_active,
   updated_at = now();