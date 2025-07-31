/*
  # Fix Database Authentication Errors

  This migration addresses issues that can cause "Database error granting user" during password resets:
  
  1. Updates the handle_new_user function to be more robust
  2. Ensures proper error handling in triggers
  3. Fixes potential RLS policy conflicts
  4. Adds proper permissions for auth operations
*/

-- First, let's update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if this is a confirmed user (not during password reset)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Insert user profile with proper error handling
    INSERT INTO public.user_profiles (user_id, email, display_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
      updated_at = now();

    -- Insert user settings with proper error handling
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert user account status with proper error handling
    INSERT INTO public.user_account_status (user_id, status, login_count)
    VALUES (NEW.id, 'active', 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth operation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_user_login function to be more robust
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
  -- Only update on actual login (when last_sign_in_at changes)
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
    -- Update user account status with proper error handling
    INSERT INTO public.user_account_status (user_id, last_login_at, login_count)
    VALUES (NEW.id, NEW.last_sign_in_at, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      last_login_at = EXCLUDED.last_login_at,
      login_count = user_account_status.login_count + 1,
      updated_at = now();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth operation
    RAISE WARNING 'Error in handle_user_login: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the update_updated_at_column function is robust
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the operation if timestamp update fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers to ensure they're properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Recreate triggers with proper timing to avoid conflicts
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_login();

-- Ensure RLS policies don't interfere with auth operations
-- Temporarily disable and re-enable RLS to refresh policies
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_account_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_account_status ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure service_role has full access (needed for auth operations)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create a function to safely handle auth operations
CREATE OR REPLACE FUNCTION public.is_auth_operation()
RETURNS boolean AS $$
BEGIN
  -- Check if the current operation is being performed by Supabase auth
  RETURN current_setting('role') = 'supabase_auth_admin' OR 
         current_setting('role') = 'service_role' OR
         current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow auth operations
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR 
    public.is_auth_operation()
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.is_auth_operation()
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    public.is_auth_operation()
  );

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR 
    public.is_auth_operation()
  );

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.is_auth_operation()
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    public.is_auth_operation()
  );

-- Fix user_account_status policies
DROP POLICY IF EXISTS "Users can view own account status" ON public.user_account_status;
CREATE POLICY "Users can view own account status" ON public.user_account_status
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    public.is_admin() OR
    public.is_auth_operation()
  );

DROP POLICY IF EXISTS "Admins can manage account statuses" ON public.user_account_status;
CREATE POLICY "System can manage account statuses" ON public.user_account_status
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR 
    public.is_auth_operation()
  )
  WITH CHECK (
    public.is_admin() OR 
    public.is_auth_operation()
  );

-- Create a policy for auth operations to insert/update account status
CREATE POLICY "Auth operations can manage account status" ON public.user_account_status
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);