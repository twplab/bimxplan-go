-- CRITICAL SECURITY FIXES

-- 1. Enable RLS on projects table (CRITICAL ERROR)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Fix database functions with secure search_path (SECURITY WARNINGS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Add missing DELETE policy for project_collaborators
CREATE POLICY "Project owners can remove collaborators"
ON public.project_collaborators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_collaborators.project_id 
    AND projects.owner_id = auth.uid()
  )
);