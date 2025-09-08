import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Users, Calendar, Settings, LogOut, Sparkles } from "lucide-react"

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
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  const fetchProjects = useCallback(async () => {
    try {
      console.log('Fetching projects...')
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      console.log('Projects fetched:', data)
      setProjects(data || [])
    } catch (error: unknown) {
      console.error('Error fetching projects:', error)
      toast({
        title: "Error loading projects",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    console.log('Dashboard useEffect triggered, user:', user?.email)
    if (!user) {
      console.log('No user, redirecting to auth')
      navigate('/auth')
      return
    }
    fetchProjects()
  }, [user, navigate, fetchProjects])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
                BIMxPlan Go
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                Welcome, {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
              Your Projects
            </h2>
            <p style={{ color: '#6b7280', margin: '0' }}>
              Manage your BIM Execution Plans and collaborate with your team
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <Button onClick={() => alert('Create New Project')}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button variant="outline" onClick={() => alert('Create Sample Project')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Sample Project (100% Complete)
            </Button>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first BIM Execution Plan to get started, or explore a complete sample project
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => alert('Create New Project')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                  <Button variant="outline" onClick={() => alert('Create Sample Project')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Sample Project (100% Complete)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg line-clamp-2">{project.name}</CardTitle>
                        {project.location && (
                          <CardDescription className="mt-1 text-sm">{project.location}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-gray-600">
                      {project.client_name && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{project.client_name}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>{project.project_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="border-t my-4" />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => alert(`Edit project ${project.id}`)}>
                        <FileText className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => alert(`Settings for ${project.id}`)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard