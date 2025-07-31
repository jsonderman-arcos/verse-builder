/*
  # Fix user creation triggers

  This migration fixes the database triggers that automatically create user profiles 
  and settings when a new user signs up through Supabase Auth.

  1. Functions
     - `handle_new_user()` - Creates user profile and settings on signup
  
  2. Triggers
     - Trigger on auth.users table to call handle_new_user function
  
  3. Security
     - Functions are marked as SECURITY DEFINER to run with elevated privileges
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Insert user settings with defaults
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically handle new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();