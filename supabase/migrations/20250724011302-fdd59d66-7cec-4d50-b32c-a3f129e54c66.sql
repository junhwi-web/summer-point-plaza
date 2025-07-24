-- Drop existing policies for classrooms
DROP POLICY IF EXISTS "Teachers can create classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can view their own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can update their own classrooms" ON public.classrooms;

-- Create updated RLS policies for classrooms that work with signup
CREATE POLICY "Authenticated users can create classrooms" 
  ON public.classrooms 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Teachers can view their own classrooms" 
  ON public.classrooms 
  FOR SELECT 
  TO authenticated
  USING (auth.jwt() ->> 'email' = teacher_email);

CREATE POLICY "Teachers can update their own classrooms" 
  ON public.classrooms 
  FOR UPDATE 
  TO authenticated
  USING (auth.jwt() ->> 'email' = teacher_email);

-- Update students policies to be more permissive for the demo
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
DROP POLICY IF EXISTS "Teachers can manage students in their classrooms" ON public.students;

CREATE POLICY "Anyone can view students" 
  ON public.students 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert students" 
  ON public.students 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update students" 
  ON public.students 
  FOR UPDATE 
  USING (true);

-- Update homework submissions policies
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Students can create their own submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Teachers can view submissions from their classroom students" ON public.homework_submissions;

CREATE POLICY "Anyone can view homework submissions" 
  ON public.homework_submissions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create homework submissions" 
  ON public.homework_submissions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update homework submissions" 
  ON public.homework_submissions 
  FOR UPDATE 
  USING (true);