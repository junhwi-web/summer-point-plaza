-- Add DELETE policy for students table
CREATE POLICY "Teachers can delete students in their classrooms" 
  ON public.students 
  FOR DELETE 
  USING (classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE teacher_email = auth.jwt() ->> 'email'
  ));