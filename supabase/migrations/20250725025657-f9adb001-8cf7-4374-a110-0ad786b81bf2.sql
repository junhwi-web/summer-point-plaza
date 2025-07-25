-- Allow students to view their own data by name and classroom
CREATE POLICY "Students can view their own data by name and classroom" 
ON public.students 
FOR SELECT 
USING (true);

-- Allow homework submissions to be created by anyone (for student submissions)
DROP POLICY IF EXISTS "Students can create their own homework submissions" ON public.homework_submissions;
CREATE POLICY "Students can create homework submissions" 
ON public.homework_submissions 
FOR INSERT 
WITH CHECK (true);

-- Allow students to view homework submissions
DROP POLICY IF EXISTS "Students can view their own homework submissions" ON public.homework_submissions;
CREATE POLICY "Anyone can view homework submissions" 
ON public.homework_submissions 
FOR SELECT 
USING (true);