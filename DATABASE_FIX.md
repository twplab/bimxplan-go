# 🔧 Database RLS Policy Fix Guide

## Problem Diagnosis
The application is experiencing **Row Level Security (RLS) policy violations** (error code 42501) when trying to create projects. This prevents both:
- Creating new projects
- Saving temporary projects permanently

## Root Cause
Supabase RLS policies are blocking `INSERT` operations on the `projects` table because:
1. RLS is enabled but no appropriate `INSERT` policy exists
2. Existing policies don't match the authenticated user context
3. Missing permissions for authenticated users

## Solution Options

### Option 1: Add RLS Policies (Recommended)
Execute these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on projects table (if not already enabled)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own projects
CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Create policy to allow users to select their own projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = owner_id);

-- Create policy to allow users to update their own projects
CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Create policy to allow users to delete their own projects
CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = owner_id);
```

### Option 2: Create Database Function (Alternative)
If policies don't work, create a function with SECURITY DEFINER:

```sql
-- Create a comprehensive function to create projects that bypasses RLS
CREATE OR REPLACE FUNCTION create_user_project(
    project_name TEXT,
    user_id UUID,
    project_status TEXT DEFAULT 'draft',
    project_location TEXT DEFAULT '',
    project_client_name TEXT DEFAULT '',
    project_type TEXT DEFAULT 'mixed_use',
    project_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(id UUID, name TEXT, owner_id UUID, status TEXT, location TEXT, client_name TEXT, project_type TEXT, project_data JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO projects (name, owner_id, status, location, client_name, project_type, project_data)
    VALUES (project_name, user_id, project_status, project_location, project_client_name, project_type, project_data)
    RETURNING projects.id, projects.name, projects.owner_id, projects.status, projects.location, projects.client_name, projects.project_type, projects.project_data, projects.created_at, projects.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_project TO authenticated;

-- Alternative function with different parameter names for compatibility
CREATE OR REPLACE FUNCTION create_project(
    name TEXT,
    owner_id UUID,
    status TEXT DEFAULT 'draft',
    location TEXT DEFAULT '',
    client_name TEXT DEFAULT '',
    project_type TEXT DEFAULT 'mixed_use',
    project_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(id UUID, name TEXT, owner_id UUID, status TEXT, location TEXT, client_name TEXT, project_type TEXT, project_data JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO projects (name, owner_id, status, location, client_name, project_type, project_data)
    VALUES (name, owner_id, status, location, client_name, project_type, project_data)
    RETURNING projects.id, projects.name, projects.owner_id, projects.status, projects.location, projects.client_name, projects.project_type, projects.project_data, projects.created_at, projects.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_project TO authenticated;

-- Function to update existing projects
CREATE OR REPLACE FUNCTION update_user_project(
    project_id UUID,
    project_name TEXT,
    user_id UUID,
    project_status TEXT DEFAULT 'draft',
    project_location TEXT DEFAULT '',
    project_client_name TEXT DEFAULT '',
    project_type TEXT DEFAULT 'mixed_use',
    project_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(id UUID, name TEXT, owner_id UUID, status TEXT, location TEXT, client_name TEXT, project_type TEXT, project_data JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE projects 
    SET 
        name = project_name,
        status = project_status,
        location = project_location,
        client_name = project_client_name,
        project_type = project_type,
        project_data = project_data,
        updated_at = NOW()
    WHERE projects.id = project_id AND projects.owner_id = user_id
    RETURNING projects.id, projects.name, projects.owner_id, projects.status, projects.location, projects.client_name, projects.project_type, projects.project_data, projects.created_at, projects.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_project TO authenticated;
```

### Option 3: Temporarily Disable RLS (NOT Recommended for Production)
```sql
-- ONLY for development/testing - NOT for production
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
```

## Quick Setup (Run This First)

Copy and paste this complete SQL script into your Supabase SQL Editor:

```sql
-- Step 1: Enable RLS and create policies (recommended approach)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create RLS policies
CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = owner_id);

-- Step 2: Create backup database functions (in case policies don't work)
CREATE OR REPLACE FUNCTION create_user_project(
    project_name TEXT,
    user_id UUID,
    project_status TEXT DEFAULT 'draft',
    project_location TEXT DEFAULT '',
    project_client_name TEXT DEFAULT '',
    project_type TEXT DEFAULT 'mixed_use',
    project_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(id UUID, name TEXT, owner_id UUID, status TEXT, location TEXT, client_name TEXT, project_type TEXT, project_data JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO projects (name, owner_id, status, location, client_name, project_type, project_data)
    VALUES (project_name, user_id, project_status, project_location, project_client_name, project_type, project_data)
    RETURNING projects.id, projects.name, projects.owner_id, projects.status, projects.location, projects.client_name, projects.project_type, projects.project_data, projects.created_at, projects.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_project TO authenticated;

-- Alternative function name for compatibility
CREATE OR REPLACE FUNCTION create_project(
    name TEXT,
    owner_id UUID,
    status TEXT DEFAULT 'draft',
    location TEXT DEFAULT '',
    client_name TEXT DEFAULT '',
    project_type TEXT DEFAULT 'mixed_use',
    project_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(id UUID, name TEXT, owner_id UUID, status TEXT, location TEXT, client_name TEXT, project_type TEXT, project_data JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO projects (name, owner_id, status, location, client_name, project_type, project_data)
    VALUES (name, owner_id, status, location, client_name, project_type, project_data)
    RETURNING projects.id, projects.name, projects.owner_id, projects.status, projects.location, projects.client_name, projects.project_type, projects.project_data, projects.created_at, projects.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION create_project TO authenticated;
```

## Verification Steps

After applying the fix, test in the application:

1. **Create New Project**: Should work without "Database Configuration Issue" message
2. **Save Permanently**: Should convert temporary projects to permanent ones
3. **Create Sample Project**: Should create directly in database

## Additional Policies Needed

You may also need policies for related tables:

```sql
-- Profiles table policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Project versions policies
CREATE POLICY "Users can view versions of their projects" ON project_versions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_versions.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert versions of their projects" ON project_versions 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_versions.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- Project collaborators policies  
CREATE POLICY "Users can view collaborators of their projects" ON project_collaborators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_collaborators.project_id 
            AND projects.owner_id = auth.uid()
        )
        OR project_collaborators.user_id = auth.uid()
    );
```

## Testing the Fix

After running the SQL commands:

1. Refresh the application
2. Try "Create Your First Project" - should work directly
3. Try "Create Sample Project" - should work directly  
4. No more temporary projects should be needed

## Troubleshooting

If issues persist:

1. **Check if policies exist**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'projects';
   ```

2. **Check RLS status**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'projects';
   ```

3. **Test function exists**:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'create_user_project';
   ```

4. **Check user permissions**:
   ```sql
   SELECT auth.uid(); -- Should return current user ID
   ```