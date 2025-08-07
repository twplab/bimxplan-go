-- Create security definer function to check project access without RLS recursion
CREATE OR REPLACE FUNCTION public.user_can_access_project(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
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
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.project_collaborators;
DROP POLICY IF EXISTS "Users can view their own projects and collaborated projects" ON public.projects;

-- Create new non-recursive policies for project_collaborators
CREATE POLICY "Users can view collaborators of accessible projects" 
ON public.project_collaborators 
FOR SELECT 
USING (public.user_can_access_project(project_id));

-- Create new non-recursive policy for projects
CREATE POLICY "Users can view accessible projects" 
ON public.projects 
FOR SELECT 
USING (public.user_can_access_project(id));