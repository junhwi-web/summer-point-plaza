-- Allow anonymous users to read classrooms by code for student login
CREATE POLICY "Allow anonymous users to find classrooms by code" 
  ON public.classrooms 
  FOR SELECT 
  TO anon
  USING (true);