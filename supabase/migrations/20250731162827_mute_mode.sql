/*
  # User Account System for Bible Verse App

  1. New Tables
    - `user_profiles` - Store user profile information and preferences
    - `user_verses_progress` - Track verse memorization progress per user
    - `user_exercise_completions` - Record detailed exercise completion data
    - `user_settings` - Store user-specific settings and preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
    - Ensure data privacy and security

  3. Indexes
    - Add performance indexes for common queries
    - Optimize for user-specific data retrieval
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user verses progress table
CREATE TABLE IF NOT EXISTS user_verses_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_reference text NOT NULL,
  verse_text text NOT NULL,
  translation text DEFAULT 'ESV',
  current_week_day integer DEFAULT 1 CHECK (current_week_day >= 1 AND current_week_day <= 7),
  week_start_date date DEFAULT CURRENT_DATE,
  is_completed boolean DEFAULT false,
  completion_date timestamptz,
  total_exercises_completed integer DEFAULT 0,
  accuracy_average numeric(5,2) DEFAULT 0,
  time_spent_total integer DEFAULT 0, -- in milliseconds
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, verse_reference)
);

-- Create user exercise completions table
CREATE TABLE IF NOT EXISTS user_exercise_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_progress_id uuid REFERENCES user_verses_progress(id) ON DELETE CASCADE NOT NULL,
  exercise_type text NOT NULL CHECK (exercise_type IN ('typing', 'fill-blanks', 'reference', 'reflection')),
  exercise_round integer DEFAULT 1,
  time_spent integer NOT NULL, -- in milliseconds
  accuracy numeric(5,2) NOT NULL,
  completed_at timestamptz DEFAULT now(),
  exercise_data jsonb DEFAULT '{}', -- Store exercise-specific data
  created_at timestamptz DEFAULT now()
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bible_order text DEFAULT 'canonical' CHECK (bible_order IN ('canonical', 'chronological', 'narrative', 'bookType')),
  preferred_translation text DEFAULT 'ESV',
  daily_reminder_enabled boolean DEFAULT true,
  daily_reminder_time time DEFAULT '09:00:00',
  theme_preference text DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  notification_preferences jsonb DEFAULT '{"email": true, "push": false}',
  privacy_settings jsonb DEFAULT '{"profile_public": false, "progress_public": false}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verses_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_verses_progress
CREATE POLICY "Users can read own verses progress"
  ON user_verses_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verses progress"
  ON user_verses_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verses progress"
  ON user_verses_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_exercise_completions
CREATE POLICY "Users can read own exercise completions"
  ON user_exercise_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise completions"
  ON user_exercise_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verses_progress_user_id ON user_verses_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verses_progress_reference ON user_verses_progress(user_id, verse_reference);
CREATE INDEX IF NOT EXISTS idx_user_exercise_completions_user_id ON user_exercise_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exercise_completions_verse_progress ON user_exercise_completions(verse_progress_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create function to automatically create user profile and settings on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile and settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verses_progress_updated_at
  BEFORE UPDATE ON user_verses_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();