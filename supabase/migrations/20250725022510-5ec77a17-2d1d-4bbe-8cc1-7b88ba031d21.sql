-- Drop the existing restrictive policy
DROP POLICY "Authenticated users can find classrooms by code" ON public.classrooms;

-- Create a new policy that allows anyone to read classrooms by code (for student login)
CREATE POLICY "Anyone can view classrooms by code" 
ON public.classrooms 
FOR SELECT 
USING (true);