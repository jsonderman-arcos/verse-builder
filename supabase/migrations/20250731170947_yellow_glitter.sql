/*
  # Create Admin User Management System

  1. New Tables
    - `admin_users` - Track which users have admin privileges
    - `user_account_status` - Track account status and suspension details
    - `admin_audit_log` - Log all admin actions for accountability

  2. Security
    - Enable RLS on all new tables
    - Add policies for admin-only access
    - Create admin check function

  3. Functions
    - Admin user management functions
    - Account suspension/reactivation
    - Password reset utilities
*/

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '{"manage_users": true, "view_analytics": true, "system_admin": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user account status table
CREATE TABLE IF NOT EXISTS user_account_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending_verification')),
  suspended_at timestamptz,
  suspended_by uuid REFERENCES auth.users(id),
  suspension_reason text,
  suspension_expires_at timestamptz,
  last_login_at timestamptz,
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_account_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_name text,
  target_user uuid DEFAULT NULL,
  action_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_user_id, target_user_id, action, details)
  VALUES (auth.uid(), target_user, action_name, action_details);
END;
$$;

-- Create function to suspend user account
CREATE OR REPLACE FUNCTION suspend_user_account(
  target_user_id uuid,
  reason text DEFAULT NULL,
  expires_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update or insert account status
  INSERT INTO user_account_status (user_id, status, suspended_at, suspended_by, suspension_reason, suspension_expires_at)
  VALUES (target_user_id, 'suspended', now(), auth.uid(), reason, expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status = 'suspended',
    suspended_at = now(),
    suspended_by = auth.uid(),
    suspension_reason = reason,
    suspension_expires_at = expires_at,
    updated_at = now();

  -- Log the action
  PERFORM log_admin_action('suspend_account', target_user_id, 
    jsonb_build_object('reason', reason, 'expires_at', expires_at));

  RETURN true;
END;
$$;

-- Create function to reactivate user account
CREATE OR REPLACE FUNCTION reactivate_user_account(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update account status
  INSERT INTO user_account_status (user_id, status)
  VALUES (target_user_id, 'active')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status = 'active',
    suspended_at = NULL,
    suspended_by = NULL,
    suspension_reason = NULL,
    suspension_expires_at = NULL,
    updated_at = now();

  -- Log the action
  PERFORM log_admin_action('reactivate_account', target_user_id);

  RETURN true;
END;
$$;

-- Create function to force password reset
CREATE OR REPLACE FUNCTION admin_force_password_reset(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Log the action
  PERFORM log_admin_action('force_password_reset', target_user_id, 
    jsonb_build_object('email', user_email));

  -- Note: The actual password reset email would be sent via Supabase Auth API
  -- This function primarily logs the action and validates permissions
  
  RETURN true;
END;
$$;

-- Create function to update last login
CREATE OR REPLACE FUNCTION update_last_login(user_uuid uuid DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_account_status (user_id, last_login_at, login_count)
  VALUES (user_uuid, now(), 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_login_at = now(),
    login_count = user_account_status.login_count + 1,
    updated_at = now();
END;
$$;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a 
      WHERE a.user_id = auth.uid() 
      AND a.is_active = true 
      AND (a.permissions->>'system_admin')::boolean = true
    )
  );

-- RLS Policies for user_account_status
CREATE POLICY "Users can view own account status"
  ON user_account_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all account statuses"
  ON user_account_status
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage account statuses"
  ON user_account_status
  FOR ALL
  TO authenticated
  USING (is_admin());

-- RLS Policies for admin_audit_log
CREATE POLICY "Admins can view audit log"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "System creates audit log entries"
  ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid());

-- Create trigger to update last login on auth
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update on successful login (when last_sign_in_at changes)
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
    PERFORM update_last_login(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for login tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_user_login' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_user_login
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_user_login();
  END IF;
END $$;

-- Update the handle_new_user function to include account status
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Create user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  -- Create account status
  INSERT INTO public.user_account_status (user_id, status)
  VALUES (NEW.id, 'active');

  RETURN NEW;
END;
$$;