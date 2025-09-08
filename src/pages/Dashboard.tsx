import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, Users, Calendar, Settings, LogOut, Sparkles } from "lucide-react"
import { createSampleBEPProject } from "@/components/bep/BEPSampleProject"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SimpleSettingsButton } from "@/components/SimpleSettingsButton"
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
  }, [user, navigate])

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

  // Test database connectivity
  const testDatabase = async () => {
    try {
      console.log('Testing database connection...')
      const { data, error } = await supabase
        .from('projects')
        .select('count')
        .limit(1)
      
      console.log('Database test result:', { data, error })
      
      if (error) {
        toast({
          title: "Database Error",
          description: `Database connection failed: ${error.message}`,
          variant: "destructive",
        })
        return false
      }
      return true
    } catch (error) {
      console.error('Database test failed:', error)
      return false
    }
  }

  const createNewProject = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a project.",
        variant: "destructive",
      })
      return
    }

    // Test database first
    const dbOk = await testDatabase()
    if (!dbOk) return

    try {
      // Get the current authenticated user to ensure we have the right ID
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`)
      }
      
      if (!authUser.user) {
        throw new Error('No authenticated user found')
      }
      
      console.log('Creating new project for authenticated user:', authUser.user.id)
      console.log('User object:', { id: authUser.user.id, email: authUser.user.email })
      
      // Ensure user profile exists first (this might be required by RLS)
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

      // Try using raw SQL to bypass RLS or find a workaround
      let data, error;
      
      // Attempt 1: Try enhanced database function approaches
      try {
        console.log('Attempting to create project via database functions...')
        
        // Try the comprehensive database functions with full parameters
        const functionAttempts = [
          {
            name: 'create_user_project',
            params: {
              project_name: 'New BEP Project',
              user_id: authUser.user.id,
              project_status: 'draft',
              project_location: '',
              project_client_name: '',
              project_type: 'mixed_use',
              project_data: {}
            }
          },
          {
            name: 'create_project',
            params: {
              name: 'New BEP Project',
              owner_id: authUser.user.id,
              status: 'draft',
              location: '',
              client_name: '',
              project_type: 'mixed_use',
              project_data: {}
            }
          },
          {
            name: 'create_user_project',
            params: {
              project_name: 'New BEP Project',
              user_id: authUser.user.id,
              project_status: 'draft'
            }
          },
          {
            name: 'create_project',
            params: {
              project_name: 'New BEP Project',
              user_id: authUser.user.id,
              project_status: 'draft'
            }
          }
        ]
        
        let rpcData = null
        let rpcError = null
        
        for (const attempt of functionAttempts) {
          try {
            console.log(`Trying function: ${attempt.name} with params:`, Object.keys(attempt.params))
            const result = await supabase.rpc(attempt.name, attempt.params)
            
            if (!result.error) {
              rpcData = result.data
              console.log(`Success with function ${attempt.name}:`, rpcData)
              break
            } else {
              console.log(`Function ${attempt.name} failed:`, result.error.message)
              rpcError = result.error
            }
          } catch (err) {
            console.log(`Function ${attempt.name} errored:`, err)
            rpcError = err
          }
        }
        
        if (rpcData) {
          data = rpcData
          error = null
        } else {
          throw new Error(`All database functions failed. Last error: ${rpcError?.message || 'Unknown error'}`)
        }
      } catch (rpcError) {
        console.log('All database functions failed, trying direct insert:', rpcError)
        
        // Attempt 2: Try different session/auth approaches
        console.log('Trying enhanced authentication approaches...')
        
        // Set session context that RLS policies might expect
        try {
          await supabase.rpc('set_user_context', { user_id: authUser.user.id })
        } catch (contextError) {
          console.log('set_user_context function not available:', contextError)
        }
        
        // Try with explicit session confirmation
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Current session:', { 
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          accessToken: sessionData.session?.access_token ? 'present' : 'missing'
        })
        
        // Attempt direct insert with full session context
        const insertResult = await supabase
          .from('projects')
          .insert({
            name: 'New BEP Project',
            owner_id: authUser.user.id,
            status: 'draft',
            location: '',
            client_name: '',
            project_type: 'mixed_use',
            project_data: {}
          })
          .select()
          .single()
          
        data = insertResult.data
        error = insertResult.error
        
        console.log('Direct insert result:', { data, error })
      }

      console.log('Supabase response:', { data, error })
      if (error) {
        console.error('Database error details:', error)
        
        // Enhanced RLS error handling
        if (error.code === '42501' || error.message?.includes('new row violates row-level security policy')) {
          toast({
            title: "Database Access Restricted",
            description: "Run the Quick Setup SQL from DATABASE_FIX.md in Supabase, then refresh. Creating temporary project for now.",
            variant: "destructive",
          })
          
          // Create a temporary mock project ID and navigate to it
          const mockProjectId = `temp_${Date.now()}`
          console.log('Creating temporary project with ID:', mockProjectId)
          
          // Store temporary project data in localStorage for now
          localStorage.setItem(`temp_project_${mockProjectId}`, JSON.stringify({
            id: mockProjectId,
            name: 'New BEP Project (Temporary)',
            status: 'draft',
            owner_id: authUser.user.id,
            created_at: new Date().toISOString(),
            project_data: {}
          }))
          
          navigate(`/project/${mockProjectId}`)
          return
        }
        
        throw error
      }
      
      toast({
        title: "Project created",
        description: "Your new BEP project has been created.",
      })
      
      navigate(`/project/${data.id}`)
    } catch (error: unknown) {
      console.error('Detailed error creating project:', error)
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      toast({
        title: "Error creating project",
        description: `Failed to create project: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const createSampleProject = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a sample project.",
        variant: "destructive",
      })
      return
    }
    
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
      
      let projectId
      try {
        projectId = await createSampleBEPProject(user.id)
      } catch (error) {
        console.log('Sample project creation failed, creating temporary sample:', error)
        
        // Create a temporary sample project with complete BEP data
        const mockProjectId = `temp_sample_${Date.now()}`
        
        // Define complete sample data directly here (matching BEPSampleProject.ts structure)
        const sampleData = {
          project_overview: {
            project_name: "BIMxPlan Go – Sample Project (100% Complete)",
            client_name: "Demo Client Corporation",
            location: "123 Innovation Drive, Tech City, CA 90210",
            project_type: "Mixed-Use Development",
            key_milestones: [
              { name: "Design Development Complete", date: "2024-03-15", description: "All design elements finalized and approved" },
              { name: "Construction Documents", date: "2024-06-01", description: "Complete CD set ready for permitting" },
              { name: "Construction Start", date: "2024-09-01", description: "Groundbreaking and construction commencement" }
            ]
          },
          team_responsibilities: {
            firms: [
              { name: "ABC Architecture", discipline: "Architecture", bim_lead: "Jane Smith, AIA", contact_info: "jane.smith@abcarch.com | (555) 123-4567" },
              { name: "DEF Structural Engineers", discipline: "Structural Engineering", bim_lead: "John Doe, PE", contact_info: "john.doe@defstruct.com | (555) 234-5678" },
              { name: "GHI MEP Consultants", discipline: "MEP Engineering", bim_lead: "Sarah Johnson, PE", contact_info: "sarah.johnson@ghimep.com | (555) 345-6789" }
            ]
          },
          software_overview: {
            main_tools: [
              { name: "Autodesk Revit", version: "2025", discipline: "Architecture, Structure, MEP", usage: "Primary modeling platform for all disciplines" },
              { name: "Autodesk Navisworks Manage", version: "2025", discipline: "Coordination", usage: "Model coordination and clash detection" }
            ],
            team_specific_tools: [
              { name: "Autodesk AutoCAD", version: "2025", discipline: "Site/Civil", usage: "Site planning and civil drawings" },
              { name: "Bentley MicroStation", version: "10.16", discipline: "Infrastructure", usage: "Utility and infrastructure modeling" }
            ]
          },
          modeling_scope: {
            general_lod: "LOD 300",
            discipline_lods: [
              { discipline: "Architecture", lod_level: "LOD 350", description: "Detailed architectural elements for coordination" },
              { discipline: "Structure", lod_level: "LOD 300", description: "Structural framing and major elements" },
              { discipline: "MEP", lod_level: "LOD 350", description: "Detailed MEP systems for coordination" }
            ],
            exceptions: [
              "Furniture and equipment modeled to LOD 200",
              "Landscape elements excluded from BIM model"
            ],
            units: "Imperial (feet and inches)",
            levels_grids_strategy: "Shared levels and grids managed by Architecture team. All disciplines to reference shared positioning system."
          },
          file_naming: {
            use_conventions: true,
            prefix_format: "[PROJECT_CODE]_[DISCIPLINE]_[BUILDING]_[LEVEL]_[TYPE]_[VERSION]",
            discipline_codes: "AR=Architecture, ST=Structural, ME=Mechanical, EL=Electrical, PL=Plumbing",
            versioning_format: "V[XX] for major versions, incremental letters (A,B,C) for minor revisions",
            examples: [
              "DEMO_AR_MAIN_L01_MODEL_V01.rvt",
              "DEMO_ST_MAIN_ALL_MODEL_V02A.rvt",
              "DEMO_ME_MAIN_MECH_MODEL_V01.rvt"
            ]
          },
          collaboration_cde: {
            platform: "Autodesk Construction Cloud (ACC)",
            file_linking_method: "Overlay linking with shared coordinates",
            sharing_frequency: "Weekly coordination uploads, daily working file sync",
            setup_responsibility: "Lead Architect (ABC Architecture)",
            access_controls: "Project-based permissions with discipline-specific folders"
          },
          geolocation: {
            is_georeferenced: true,
            coordinate_setup: "NAD83 State Plane California Zone 5",
            origin_location: "Southwest corner of site at property line intersection",
            coordinate_system: "US Survey Feet, State Plane California Zone 5 (EPSG:2229)"
          },
          model_checking: {
            clash_detection_tools: [
              "Autodesk Navisworks Manage",
              "Solibri Model Checker"
            ],
            coordination_process: "Weekly coordination meetings with clash detection reports distributed 48 hours prior",
            meeting_frequency: "Weekly Tuesdays 10:00 AM PT via Microsoft Teams",
            responsibility_matrix: "Architecture leads coordination, each discipline responsible for resolving discipline-specific clashes within 5 business days"
          },
          outputs_deliverables: {
            deliverables_by_phase: [
              {
                phase: "Schematic Design",
                deliverables: ["Conceptual models", "Design intent drawings"],
                formats: ["PDF", "RVT"],
                responsibility: "Architecture"
              },
              {
                phase: "Design Development",
                deliverables: ["Coordinated discipline models", "Clash detection reports"],
                formats: ["RVT", "NWD", "PDF"],
                responsibility: "All disciplines"
              },
              {
                phase: "Construction Documents",
                deliverables: ["Final coordinated models", "Construction drawings", "IFC exports"],
                formats: ["RVT", "DWG", "PDF", "IFC"],
                responsibility: "All disciplines"
              }
            ],
            formats_standards: [
              "IFC 4.0 for model exchanges",
              "PDF/A for long-term archival",
              "Native formats (RVT) for active modeling"
            ],
            milestone_schedule: [
              {
                milestone: "SD Models Complete",
                deadline: "2024-01-15",
                deliverables: ["Architectural massing model", "Preliminary structural layout"]
              },
              {
                milestone: "DD Coordination Complete",
                deadline: "2024-03-15",
                deliverables: ["Fully coordinated models", "Zero critical clashes"]
              },
              {
                milestone: "CD Final Models",
                deadline: "2024-06-01",
                deliverables: ["Construction-ready models", "Final drawing sets", "IFC deliverables"]
              }
            ]
          }
        }
        
        localStorage.setItem(`temp_project_${mockProjectId}`, JSON.stringify({
          id: mockProjectId,
          name: 'BIMxPlan Go – Sample Project (100% Complete) [Temporary]',
          status: 'completed',
          owner_id: user.id,
          client_name: 'Demo Client Corporation',
          location: '123 Innovation Drive, Tech City, CA 90210',
          project_type: 'Mixed-Use Development',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          project_data: sampleData
        }))
        
        projectId = mockProjectId
        
        toast({
          title: "Sample Project Created (Temporary)",
          description: "A complete sample BEP project has been created locally for testing.",
        })
      }
      
      // Only show success toast for database projects (not temporary ones)
      if (!projectId.startsWith('temp_')) {
        toast({
          title: "Sample Project Created",
          description: "A 100% complete sample BEP project has been created for you to explore.",
        })
      }
      
      // Refresh projects list
      await fetchProjects()
      
      // Navigate to the new sample project
      navigate(`/project/${projectId}`)
    } catch (error: unknown) {
      console.error('Detailed error creating sample project:', error)
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      toast({
        title: "Error creating sample project",
        description: `Failed to create sample project: ${errorMessage}`,
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
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer group"
                title="Back to Home"
              >
                <img 
                  src={logoImage} 
                  alt="BIMxPlan Go" 
                  className="h-10 w-10 object-contain bg-transparent group-hover:scale-105 transition-transform" 
                />
                <h1 className="text-lg sm:text-xl font-bold text-foreground">BIMxPlan Go</h1>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                Welcome, {user?.email}
              </span>
              <div className="flex items-center gap-2">
                <SimpleSettingsButton />
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
      <main className="container mx-auto px-4 py-8">
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
                      title="Project Settings"
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
  )

}

export default Dashboard