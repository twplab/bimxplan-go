import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthProvider } from "@/components/auth/AuthProvider"
import { BEPFormWizard } from "@/components/bep/BEPFormWizard"
import { useAuth } from "@/components/auth/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2 } from "lucide-react"

interface Project {
  id: string
  name: string
  location: string
  client_name: string
  project_type: string
  project_data: any
  created_at: string
  updated_at: string
}

const ProjectEditorContent = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    if (projectId) {
      fetchProject()
    }
  }, [user, projectId, navigate])

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle()

      if (error) throw error
      
      if (!data) {
        toast({
          title: "Project not found",
          description: "The project you're looking for doesn't exist or you don't have access to it.",
          variant: "destructive",
        })
        navigate('/dashboard')
        return
      }

      setProject(data)
    } catch (error: any) {
      toast({
        title: "Error loading project",
        description: error.message,
        variant: "destructive",
      })
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectUpdate = async (updatedData: any) => {
    if (!project) return

    try {
      // Create a new version first
      const { data: versionData, error: versionError } = await supabase
        .from('project_versions')
        .select('version_number')
        .eq('project_id', project.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextVersionNumber = (versionData?.version_number || 0) + 1

      // Save version
      const { error: saveVersionError } = await supabase
        .from('project_versions')
        .insert({
          project_id: project.id,
          version_number: nextVersionNumber,
          project_data: updatedData,
          created_by: user?.id,
          changelog: `Version ${nextVersionNumber} - Auto-saved`
        })

      if (saveVersionError) throw saveVersionError

      // Update the main project record
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          project_data: updatedData,
          name: updatedData.project_overview?.project_name || project.name,
          location: updatedData.project_overview?.location || project.location,
          client_name: updatedData.project_overview?.client_name || project.client_name,
          project_type: updatedData.project_overview?.project_type || project.project_type,
        })
        .eq('id', project.id)

      if (updateError) throw updateError

      toast({
        title: "Project saved",
        description: `Version ${nextVersionNumber} has been saved successfully.`,
      })

      // Update local state
      setProject(prev => prev ? {
        ...prev,
        project_data: updatedData,
        name: updatedData.project_overview?.project_name || prev.name,
        location: updatedData.project_overview?.location || prev.location,
        client_name: updatedData.project_overview?.client_name || prev.client_name,
        project_type: updatedData.project_overview?.project_type || prev.project_type,
      } : null)

    } catch (error: any) {
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">{project.location}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <BEPFormWizard
          onClose={handleClose}
          initialData={project.project_data}
          onUpdate={handleProjectUpdate}
          projectId={project.id}
        />
      </div>
    </div>
  )
}

export default ProjectEditorContent