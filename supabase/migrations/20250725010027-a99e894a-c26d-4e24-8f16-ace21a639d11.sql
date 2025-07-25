-- Fix remaining function search path issues
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_daily_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Clear today's rankings
  DELETE FROM public.daily_rankings WHERE game_date = CURRENT_DATE;
  
  -- Insert new top 5 rankings for each classroom for today
  INSERT INTO public.daily_rankings (student_id, classroom_id, score, rank_position, game_date)
  SELECT 
    student_id,
    classroom_id,
    MAX(score) as best_score,
    ROW_NUMBER() OVER (PARTITION BY classroom_id ORDER BY MAX(score) DESC) as rank_position,
    CURRENT_DATE
  FROM public.game_sessions 
  WHERE game_date = CURRENT_DATE
  GROUP BY student_id, classroom_id
  HAVING ROW_NUMBER() OVER (PARTITION BY classroom_id ORDER BY MAX(score) DESC) <= 5;
END;
$$;