import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, Database, ExternalLink, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export const DatabaseSetupHelp = () => {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const quickSetupSQL = `-- Step 1: Enable RLS and create policies (recommended approach)
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

GRANT EXECUTE ON FUNCTION create_project TO authenticated;`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(quickSetupSQL)
      setCopied(true)
      toast({
        title: "SQL Copied",
        description: "The setup SQL has been copied to your clipboard. Paste it in Supabase SQL Editor.",
      })
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please select and copy the SQL manually.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-600" />
          <CardTitle>Database Setup Required</CardTitle>
        </div>
        <CardDescription>
          Fix database access restrictions by running this SQL in your Supabase project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Quick Fix:</strong> Copy the SQL below and run it in your Supabase SQL Editor to enable project creation.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Setup Instructions</h3>
            <Badge variant="outline">Required</Badge>
          </div>
          
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open your Supabase project dashboard</li>
            <li>Go to the SQL Editor tab</li>
            <li>Copy the SQL script below</li>
            <li>Paste and run it in the SQL Editor</li>
            <li>Refresh this application</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Quick Setup SQL</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy SQL"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://app.supabase.com', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Supabase
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
              <code>{quickSetupSQL}</code>
            </pre>
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>What this does:</strong> Creates Row Level Security policies that allow users to manage their own projects, 
            plus backup database functions that bypass RLS restrictions if needed.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}