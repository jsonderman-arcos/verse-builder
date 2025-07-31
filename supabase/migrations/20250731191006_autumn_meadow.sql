/*
  # Fix infinite recursion in admin_users RLS policies

  1. Problem
    - The `is_admin()` function queries `admin_users` table
    - RLS policies on `admin_users` call `is_admin()` 
    - This creates infinite recursion

  2. Solution
    - Create a security definer function that bypasses RLS
    - Update policies to use direct queries instead of recursive functions
    - Ensure proper access control without circular dependencies

  3. Security
    - Maintain proper access control
    - Only allow admins to manage admin users
    - Prevent privilege escalation
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Create a security definer function to check admin status without RLS
CREATE OR REPLACE FUNCTION check_user_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = check_user_is_admin.user_id 
    AND is_active = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_is_admin(uuid) TO authenticated;

-- Create new policies that don't cause recursion
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (check_user_is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid()
      AND a.is_active = true
      AND (a.permissions ->> 'system_admin')::boolean = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid()
      AND a.is_active = true
      AND (a.permissions ->> 'system_admin')::boolean = true
    )
  );

-- Update the is_admin function to use the security definer function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN check_user_is_admin(auth.uid());
END;
$$;