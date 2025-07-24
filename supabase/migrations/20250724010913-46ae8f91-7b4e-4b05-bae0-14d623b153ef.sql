-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  teacher_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create homework submissions table
CREATE TABLE public.homework_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  homework_type TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- Create function to generate random class code
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  SELECT array_to_string(
    array(
      SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil(random() * 26)::integer, 1)
      FROM generate_series(1, 5)
    ), 
    ''
  ) INTO code;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_classrooms_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for classrooms
CREATE POLICY "Teachers can view their own classrooms" 
  ON public.classrooms 
  FOR SELECT 
  USING (auth.jwt() ->> 'email' = teacher_email);

CREATE POLICY "Teachers can create classrooms" 
  ON public.classrooms 
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'email' = teacher_email);

CREATE POLICY "Teachers can update their own classrooms" 
  ON public.classrooms 
  FOR UPDATE 
  USING (auth.jwt() ->> 'email' = teacher_email);

-- RLS Policies for students
CREATE POLICY "Students can view their own data" 
  ON public.students 
  FOR SELECT 
  USING (true);

CREATE POLICY "Teachers can manage students in their classrooms" 
  ON public.students 
  FOR ALL 
  USING (
    classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE teacher_email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policies for homework submissions
CREATE POLICY "Students can view their own submissions" 
  ON public.homework_submissions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Students can create their own submissions" 
  ON public.homework_submissions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Teachers can view submissions from their classroom students" 
  ON public.homework_submissions 
  FOR SELECT 
  USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classrooms c ON s.classroom_id = c.id
      WHERE c.teacher_email = auth.jwt() ->> 'email'
    )
  );