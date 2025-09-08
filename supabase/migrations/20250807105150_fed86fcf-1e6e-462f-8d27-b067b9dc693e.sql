-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  company TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  client_name TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'draft',
  project_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project versions table for changelog/history
CREATE TABLE public.project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  project_data JSONB NOT NULL,
  changelog TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project collaborators table
CREATE TABLE public.project_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects and collaborated projects" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR EXISTS (
    SELECT 1 FROM public.project_collaborators 
    WHERE project_id = projects.id 
    AND user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  )
);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects or collaborated projects with editor role" 
ON public.projects 
FOR UPDATE 
USING (
  auth.uid() = owner_id 
  OR EXISTS (
    SELECT 1 FROM public.project_collaborators 
    WHERE project_id = projects.id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'editor')
    AND accepted_at IS NOT NULL
  )
);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create RLS policies for project versions
CREATE POLICY "Users can view versions of accessible projects" 
ON public.project_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_versions.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.project_collaborators 
        WHERE project_id = projects.id 
        AND user_id = auth.uid() 
        AND accepted_at IS NOT NULL
      )
    )
  )
);

CREATE POLICY "Users can create versions for editable projects" 
ON public.project_versions 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_versions.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.project_collaborators 
        WHERE project_id = projects.id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'editor')
        AND accepted_at IS NOT NULL
      )
    )
  )
);

-- Create RLS policies for project collaborators
CREATE POLICY "Users can view collaborators of their projects" 
ON public.project_collaborators 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_collaborators.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc2
        WHERE pc2.project_id = projects.id 
        AND pc2.user_id = auth.uid() 
        AND pc2.accepted_at IS NOT NULL
      )
    )
  )
);

CREATE POLICY "Project owners can invite collaborators" 
ON public.project_collaborators 
FOR INSERT 
WITH CHECK (
  auth.uid() = invited_by
  AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_collaborators.project_id 
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own collaboration status" 
ON public.project_collaborators 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();