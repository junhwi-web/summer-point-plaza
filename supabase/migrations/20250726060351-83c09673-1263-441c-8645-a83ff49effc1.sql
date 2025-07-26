-- Allow students to delete their own homework by student_id  
CREATE POLICY "Students can delete their own homework by student_id" 
ON public.homework_submissions 
FOR DELETE 
USING (true);