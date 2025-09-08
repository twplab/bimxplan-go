// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from "@/components/auth/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, Save, Database } from "lucide-react"
import { ProjectOverviewForm } from "@/components/bep/forms/ProjectOverviewForm"
import { TeamResponsibilitiesForm } from "@/components/bep/forms/TeamResponsibilitiesForm"
import { SoftwareOverviewForm } from "@/components/bep/forms/SoftwareOverviewForm"
import { ModelingScopeForm } from "@/components/bep/forms/ModelingScopeForm"
import { FileNamingForm } from "@/components/bep/forms/FileNamingForm"
import { CollaborationCDEForm } from "@/components/bep/forms/CollaborationCDEForm"
import { GeolocationForm } from "@/components/bep/forms/GeolocationForm"
import { ModelCheckingForm } from "@/components/bep/forms/ModelCheckingForm"
import { OutputsDeliverablesForm } from "@/components/bep/forms/OutputsDeliverablesForm"
import { EnhancedBEPPreview } from "@/components/bep/EnhancedBEPPreview"
import { DatabaseSetupHelp } from "@/components/DatabaseSetupHelp"

// Simple BEP Wizard Component
const SimpleBEPWizard = ({ projectData, onUpdate, onClose, projectId }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState(projectData || {})
  
  const steps = [
    'Project Overview', 'Team & Responsibilities', 'Software Overview', 
    'Modeling Scope', 'File Naming', 'Collaboration & CDE', 
    'Geolocation', 'Model Checking', 'Outputs & Deliverables', 'Preview & Export'
  ]
  
  const handleFormUpdate = (stepData) => {
    const stepKey = ['project_overview', 'team_responsibilities', 'software_overview', 
                     'modeling_scope', 'file_naming', 'collaboration_cde', 
                     'geolocation', 'model_checking', 'outputs_deliverables', 'preview'][currentStep]
    
    const updatedData = {
      ...formData,
      [stepKey]: stepData
    }
    setFormData(updatedData)
    
    if (onUpdate) {
      onUpdate(updatedData)
    }
  }
  
  const stepKeys = ['project_overview', 'team_responsibilities', 'software_overview', 
                    'modeling_scope', 'file_naming', 'collaboration_cde', 
                    'geolocation', 'model_checking', 'outputs_deliverables', 'preview']
  
  const renderStepContent = () => {
    const stepKey = stepKeys[currentStep]
    const stepData = formData[stepKey]
    
    switch (currentStep) {
      case 0:
        return (
          <ProjectOverviewForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 1:
        return (
          <TeamResponsibilitiesForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 2:
        return (
          <SoftwareOverviewForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 3:
        return (
          <ModelingScopeForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 4:
        return (
          <FileNamingForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 5:
        return (
          <CollaborationCDEForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 6:
        return (
          <GeolocationForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 7:
        return (
          <ModelCheckingForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 8:
        return (
          <OutputsDeliverablesForm 
            data={stepData}
            onUpdate={handleFormUpdate}
          />
        )
      case 9:
        return (
          <EnhancedBEPPreview 
            data={stepData}
            projectData={formData}
            projectId={projectId}
            onUpdate={handleFormUpdate}
          />
        )
      default:
        return (
          <div className="text-center p-8">
            <p>Step {currentStep + 1} not found</p>
          </div>
        )
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              BIM Execution Plan - Step {currentStep + 1} of {steps.length}
            </CardTitle>
            <p className="text-muted-foreground">{steps[currentStep]}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </div>
        </div>
        
        {/* Simple Step Navigation Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {steps.map((step, index) => (
            <Button
              key={index}
              variant={index === currentStep ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentStep(index)}
              className="text-xs"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderStepContent()}
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            
            <Button 
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface Project {
  id: string
  name: string
  location: string
  client_name: string
  project_type: string
  project_data: Record<string, unknown>
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
  const [showDatabaseHelp, setShowDatabaseHelp] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    if (projectId) {
      fetchProject()
    }
  }, [user, projectId, navigate])

  const fetchProject = useCallback(async () => {
    try {
      // Check if this is a temporary project
      if (projectId?.startsWith('temp_')) {
        const tempData = localStorage.getItem(`temp_project_${projectId}`)
        if (tempData) {
          const project = JSON.parse(tempData)
          setProject(project)
          return
        } else {
          toast({
            title: "Temporary project not found",
            description: "The temporary project session has expired.",
            variant: "destructive",
          })
          navigate('/dashboard')
          return
        }
      }

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
    } catch (error: unknown) {
      toast({
        title: "Error loading project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [navigate, toast, projectId])

  const handleProjectUpdate = async (updatedData: Record<string, unknown>) => {
    if (!project) return

    // Handle temporary projects
    if (project.id.startsWith('temp_')) {
      const updatedProject = {
        ...project,
        project_data: updatedData,
        name: updatedData.project_overview?.project_name || project.name,
        location: updatedData.project_overview?.location || project.location,
        client_name: updatedData.project_overview?.client_name || project.client_name,
        project_type: updatedData.project_overview?.project_type || project.project_type,
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem(`temp_project_${project.id}`, JSON.stringify(updatedProject))
      setProject(updatedProject)
      
      toast({
        title: "Project saved locally",
        description: "Changes saved to local storage (temporary project).",
      })
      return
    }

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

    } catch (error: unknown) {
      toast({
        title: "Error saving project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    navigate('/dashboard')
  }

  const saveTemporaryProjectPermanently = async () => {
    if (!project || !project.id.startsWith('temp_')) return

    try {
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser.user) {
        throw new Error('Authentication required to save permanently')
      }

      console.log('Saving temporary project permanently:', {
        projectId: project.id,
        name: project.name,
        userId: authUser.user.id,
        hasProjectData: !!project.project_data
      })

      // Ensure user profile exists first (required by some RLS policies)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', authUser.user.id)
        .single()

      if (!existingProfile) {
        console.log('Creating user profile first...')
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authUser.user.id,
            email: authUser.user.email,
            display_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'User'
          })
        
        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('Profile creation error:', profileError)
          throw new Error(`Failed to create user profile: ${profileError.message}`)
        }
      }

      // Try multiple approaches to save the project
      let data, error;
      
      // Attempt 1: Try using database functions with proper parameters
      try {
        console.log('Attempting to save via database functions...')
        const functionNames = [
          'create_user_project',
          'create_project', 
          'insert_project',
          'new_project',
          'add_project'
        ]
        
        let rpcData = null
        const rpcError = null
        
        for (const funcName of functionNames) {
          try {
            console.log(`Trying function: ${funcName}`)
            
            // Try different parameter combinations that functions might expect
            const parameterSets = [
              {
                project_name: project.name.replace(' [Temporary]', ''),
                user_id: authUser.user.id,
                project_status: project.status || 'draft',
                location: project.location || '',
                client_name: project.client_name || '',
                project_type: project.project_type || 'mixed_use',
                project_data: project.project_data || {}
              },
              {
                name: project.name.replace(' [Temporary]', ''),
                owner_id: authUser.user.id,
                status: project.status || 'draft',
                location: project.location || '',
                client_name: project.client_name || '',
                project_type: project.project_type || 'mixed_use',
                project_data: project.project_data || {}
              },
              {
                project_name: project.name.replace(' [Temporary]', ''),
                user_id: authUser.user.id,
                project_status: project.status || 'draft'
              }
            ]
            
            for (const params of parameterSets) {
              try {
                const result = await supabase.rpc(funcName, params)
                
                if (!result.error) {
                  rpcData = result.data
                  console.log(`Success with function ${funcName} and params:`, Object.keys(params))
                  break
                } else {
                  console.log(`Function ${funcName} failed with params ${Object.keys(params)}:`, result.error.message)
                }
              } catch (paramError) {
                console.log(`Function ${funcName} with params ${Object.keys(params)} errored:`, paramError)
              }
            }
            
            if (rpcData) break
          } catch (err) {
            console.log(`Function ${funcName} not found or errored:`, err)
          }
        }
        
        if (rpcData) {
          data = rpcData
          error = null
        } else {
          throw new Error('No database functions worked')
        }
      } catch (rpcError) {
        console.log('All database functions failed, trying direct insert...')
        
        // Attempt 2: Direct insert with enhanced session context
        try {
          // Set session context that RLS policies might expect
          await supabase.rpc('set_user_context', { user_id: authUser.user.id }).catch(() => {
            console.log('set_user_context function not available')
          })
        } catch (contextError) {
          console.log('Context setting failed:', contextError)
        }
        
        // Try with explicit session confirmation
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Current session:', { 
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          accessToken: sessionData.session?.access_token ? 'present' : 'missing'
        })
        
        const insertResult = await supabase
          .from('projects')
          .insert({
            name: project.name.replace(' [Temporary]', ''),
            owner_id: authUser.user.id,
            status: project.status || 'draft',
            location: project.location || '',
            client_name: project.client_name || '',
            project_type: project.project_type || 'mixed_use',
            project_data: project.project_data || {}
          })
          .select()
          .single()
          
        data = insertResult.data
        error = insertResult.error
      }

      console.log('Save result:', { data, error })

      if (error) {
        if (error.code === '42501' || error.message?.includes('new row violates row-level security policy')) {
          toast({
            title: "Database Access Restricted",
            description: "Run the Quick Setup SQL from DATABASE_FIX.md in Supabase to enable permanent saving. Your work remains safe locally.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      if (!data || !data.id) {
        throw new Error('Project creation succeeded but no project ID returned')
      }

      // Remove temporary project from localStorage
      localStorage.removeItem(`temp_project_${project.id}`)
      
      toast({
        title: "Project Saved Permanently",
        description: "Your project has been saved to the database successfully.",
      })

      // Navigate to the new permanent project
      navigate(`/project/${data.id}`)

    } catch (error: unknown) {
      console.error('Error saving temporary project permanently:', error)
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      toast({
        title: "Error Saving Project",
        description: `Failed to save permanently: ${errorMessage}`,
        variant: "destructive",
      })
    }
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
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
                {project.id.startsWith('temp_') && (
                  <div className="text-xs space-y-1">
                    <p className="text-amber-600 font-medium">⚠️ Temporary Project - Data saved locally</p>
                    <p className="text-gray-600">Run SQL from DATABASE_FIX.md in Supabase to enable permanent saving</p>
                  </div>
                )}
              </div>
            </div>
            {project.id.startsWith('temp_') && (
              <div className="flex items-center gap-2">
                <Button onClick={saveTemporaryProjectPermanently} className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Save Permanently
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDatabaseHelp(!showDatabaseHelp)}
                >
                  {showDatabaseHelp ? "Hide Help" : "Setup Help"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {showDatabaseHelp && <DatabaseSetupHelp />}
        <SimpleBEPWizard
          projectData={project.project_data}
          onUpdate={handleProjectUpdate}
          onClose={handleClose}
          projectId={project.id}
        />
      </div>
    </div>
  )
}

export default ProjectEditorContent