-- Allow anonymous users to insert students during login
CREATE POLICY "Anyone can create students" 
ON public.students 
FOR INSERT 
WITH CHECK (true);