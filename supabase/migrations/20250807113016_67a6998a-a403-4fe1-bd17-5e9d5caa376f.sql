-- Add INSERT policy for projects to allow users to create their own projects
CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = owner_id);