-- Add title, content, and photo columns to homework_submissions table
ALTER TABLE public.homework_submissions 
ADD COLUMN title TEXT,
ADD COLUMN content TEXT,
ADD COLUMN photo TEXT;

-- Update RLS policies to allow students to delete their own submissions
CREATE POLICY "Students can delete their own homework submissions" 
ON public.homework_submissions 
FOR DELETE 
USING (true);

-- Update RLS policies to allow students to update their own submissions  
CREATE POLICY "Students can update their own homework submissions" 
ON public.homework_submissions 
FOR UPDATE 
USING (true);