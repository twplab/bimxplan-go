-- Fix RLS policies on all tables that may be missing

-- Enable RLS on all public tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- Create missing policies for deliverables, milestones if they exist
-- Since we don't see these tables in the schema, they may be stored as JSONB in projects.project_data

-- Ensure all functions have proper search_path
CREATE OR REPLACE FUNCTION public.user_can_access_project(project_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_uuid 
    AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid 
    AND user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  );
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;