// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, Users, Calendar, Settings, LogOut, Sparkles } from "lucide-react"
// TEMPORARILY DISABLED - These imports cause blank screen:
// import { createSampleBEPProject } from "@/components/bep/BEPSampleProject"
// import { Separator } from "@/components/ui/separator"
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { AppSidebar } from "@/components/AppSidebar"
// import { ThemeToggle } from "@/components/ui/theme-toggle"
const logoImage = "/lovable-uploads/b3298753-472d-4926-bba6-5c04d5980343.png";

interface Project {
  id: string
  name: string
  location: string
  client_name: string
  project_type: string
  status: string
  created_at: string
  updated_at: string
}

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingSample, setCreatingSample] = useState(false)
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    fetchProjects()
  }, [user, navigate, fetchProjects])

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error: unknown) {
      toast({
        title: "Error loading projects",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createNewProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: 'New BEP Project',
          location: '',
          client_name: '',
          project_type: 'mixed_use',
          owner_id: user?.id
        })
        .select()
        .single()

      if (error) throw error
      
      toast({
        title: "Project created",
        description: "Your new BEP project has been created.",
      })
      
      navigate(`/project/${data.id}`)
    } catch (error: unknown) {
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const createSampleProject = async () => {
    if (!user?.id) return
    
    setCreatingSample(true)
    try {
      // Check if sample project already exists (idempotent operation)
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user.id)
        .ilike('name', '%sample%')
        .limit(1)
      
      if (existingProjects && existingProjects.length > 0) {
        toast({
          title: "Sample Project Exists",
          description: "You already have a sample project. Opening it now.",
        })
        navigate(`/project/${existingProjects[0].id}`)
        return
      }
      
      const projectId = await createSampleBEPProject(user.id)
      
      toast({
        title: "Sample Project Created",
        description: "A 100% complete sample BEP project has been created for you to explore.",
      })
      
      // Refresh projects list
      await fetchProjects()
      
      // Navigate to the new sample project
      navigate(`/project/${projectId}`)
    } catch (error: unknown) {
      toast({
        title: "Error creating sample project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setCreatingSample(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-4 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger />
                  <div className="flex items-center">
                    <a href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
                      <img 
                        src={logoImage} 
                        alt="BIMxPlan Go" 
                        className="h-10 w-10 md:h-10 md:w-10 object-contain bg-transparent" 
                      />
                      <h1 className="text-lg sm:text-xl font-bold text-foreground">BIMxPlan Go</h1>
                    </a>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                    Welcome, {user?.email}
                  </span>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Sign Out</span>
                      <span className="sm:hidden">Out</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Projects</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your BIM Execution Plans and collaborate with your team
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={createNewProject} size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
            <Button 
              onClick={createSampleProject}
              disabled={creatingSample}
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {creatingSample ? "Creating..." : "Create Sample Project (100% Complete)"}
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first BIM Execution Plan to get started, or explore a complete sample project
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={createNewProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
                <Button 
                  onClick={createSampleProject}
                  disabled={creatingSample}
                  variant="outline"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {creatingSample ? "Creating..." : "Create Sample Project (100% Complete)"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight">{project.name}</CardTitle>
                      {project.location && (
                        <CardDescription className="mt-1 text-sm truncate">{project.location}</CardDescription>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(project.status)} text-xs whitespace-nowrap`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2.5 text-sm text-muted-foreground">
                    {project.client_name && (
                      <div className="flex items-center min-h-[20px]">
                        <Users className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate">{project.client_name}</span>
                      </div>
                    )}
                    <div className="flex items-center min-h-[20px]">
                      <Calendar className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">{new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center min-h-[20px]">
                      <FileText className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">{project.project_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 min-w-0"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-1.5 shrink-0" />
                      <span className="truncate">Edit</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="shrink-0"
                      onClick={() => navigate(`/project/${project.id}/settings`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Dashboard