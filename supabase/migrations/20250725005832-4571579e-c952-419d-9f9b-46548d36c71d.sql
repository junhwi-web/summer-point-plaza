-- Phase 1: Fix Critical RLS Policy Issues

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view homework submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Anyone can create homework submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Anyone can update homework submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Students can delete their own homework submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Students can update their own homework submissions" ON public.homework_submissions;

DROP POLICY IF EXISTS "Anyone can insert students" ON public.students;
DROP POLICY IF EXISTS "Anyone can update students" ON public.students;
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;

DROP POLICY IF EXISTS "Allow anonymous users to find classrooms by code" ON public.classrooms;

-- Create student_profiles table linked to auth.users for proper authentication
CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on student_profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Add foreign key to link homework_submissions to authenticated users
ALTER TABLE public.homework_submissions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing homework_submissions to have user_id (temporary measure)
-- In production, you'd need to handle this data migration properly

-- Create secure RLS policies for homework_submissions
CREATE POLICY "Students can view their own homework submissions" 
ON public.homework_submissions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can create their own homework submissions" 
ON public.homework_submissions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own homework submissions" 
ON public.homework_submissions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can delete their own homework submissions" 
ON public.homework_submissions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Teachers can view all homework submissions in their classrooms
CREATE POLICY "Teachers can view classroom homework submissions" 
ON public.homework_submissions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    JOIN public.student_profiles sp ON sp.classroom_id = c.id
    WHERE c.teacher_email = (auth.jwt() ->> 'email')
    AND sp.id = homework_submissions.user_id
  )
);

-- Teachers can update homework submissions (for grading)
CREATE POLICY "Teachers can update classroom homework submissions" 
ON public.homework_submissions 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    JOIN public.student_profiles sp ON sp.classroom_id = c.id
    WHERE c.teacher_email = (auth.jwt() ->> 'email')
    AND sp.id = homework_submissions.user_id
  )
);

-- Create secure RLS policies for student_profiles
CREATE POLICY "Students can view their own profile" 
ON public.student_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Students can update their own profile" 
ON public.student_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Teachers can view student profiles in their classrooms
CREATE POLICY "Teachers can view classroom student profiles" 
ON public.student_profiles 
FOR SELECT 
TO authenticated
USING (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE teacher_email = (auth.jwt() ->> 'email')
  )
);

-- Teachers can manage student profiles in their classrooms
CREATE POLICY "Teachers can manage classroom student profiles" 
ON public.student_profiles 
FOR ALL 
TO authenticated
USING (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE teacher_email = (auth.jwt() ->> 'email')
  )
);

-- Update students table policies to require authentication
CREATE POLICY "Teachers can view students in their classrooms" 
ON public.students 
FOR SELECT 
TO authenticated
USING (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE teacher_email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Teachers can manage students in their classrooms" 
ON public.students 
FOR ALL 
TO authenticated
USING (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE teacher_email = (auth.jwt() ->> 'email')
  )
);

-- Remove anonymous access to classrooms - require authentication
CREATE POLICY "Authenticated users can find classrooms by code" 
ON public.classrooms 
FOR SELECT 
TO authenticated
USING (true);

-- Phase 3: Database Security Hardening

-- Fix database functions with proper search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for student_profiles
CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create security definer function for role checking (future use)
CREATE OR REPLACE FUNCTION public.is_teacher(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE teacher_email = user_email
  );
$$;

-- Add indexes for better performance on auth queries
CREATE INDEX IF NOT EXISTS idx_homework_submissions_user_id ON public.homework_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_classroom_id ON public.student_profiles(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_email ON public.classrooms(teacher_email);