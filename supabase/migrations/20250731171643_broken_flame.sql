@@ .. @@
 */

 -- Grant admin privileges to the specified user
 INSERT INTO admin_users (user_id, permissions)
 SELECT 
   up.user_id,
   '{"manage_users": true, "system_admin": true, "view_analytics": true}'::jsonb
 FROM user_profiles up
-WHERE up.email = 'your-email@example.com'  -- Replace with actual admin email
+WHERE up.email = 'jason@blue148.com'
 ON CONFLICT (user_id) DO UPDATE SET
   permissions = EXCLUDED.permissions,
   is_active = true,
   updated_at = now();

 -- Log the admin creation
 INSERT INTO admin_audit_log (admin_user_id, action, details)
 SELECT 
   up.user_id,
   'ADMIN_GRANTED',
   '{"reason": "Initial admin setup", "permissions": ["manage_users", "system_admin", "view_analytics"]}'::jsonb
 FROM user_profiles up
-WHERE up.email = 'your-email@example.com';  -- Replace with actual admin email
+WHERE up.email = 'jason@blue148.com';