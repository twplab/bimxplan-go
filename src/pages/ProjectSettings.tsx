import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, UserPlus, Mail, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  location?: string;
  client_name?: string;
  project_type?: string;
  status: string;
  created_at: string;
  updated_at: string;
  project_data?: Record<string, unknown>;
}

interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  invited_at: string;
  accepted_at?: string;
  profiles?: {
    display_name?: string;
    email?: string;
  };
}

const ProjectSettings = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProjectData();
  }, [projectId, user, navigate]);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;

    try {
      // Fetch project data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      setProject(projectData);
      setProjectName(projectData.name);
      setProjectType(projectData.project_type || '');
      setProjectStatus(projectData.status || 'draft');
      setProjectLocation(projectData.location || '');
      setClientName(projectData.client_name || '');
      setProjectNotes(((projectData.project_data as Record<string, unknown>)?.notes as string) || '');

      // Fetch collaborators with separate profile queries
      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId);

      if (collaboratorsError) throw collaboratorsError;

      // Fetch profiles for each collaborator
      const collaboratorsWithProfiles = await Promise.all(
        (collaboratorsData || []).map(async (collaborator) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', collaborator.user_id)
            .single();

          return {
            ...collaborator,
            profiles: profile
          };
        })
      );

      setCollaborators(collaboratorsWithProfiles);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  const handleSaveProject = async () => {
    if (!project) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectName,
          project_type: projectType,
          status: projectStatus,
          location: projectLocation,
          client_name: clientName,
          project_data: {
            ...(project.project_data as Record<string, unknown> || {}),
            notes: projectNotes
          }
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project settings updated successfully',
      });

      // Refresh project data
      await fetchProjectData();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: 'Failed to save project settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!newCollaboratorEmail.trim() || !projectId) return;

    setInviting(true);
    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newCollaboratorEmail.trim())
        .single();

      if (userError) {
        toast({
          title: 'Error',
          description: 'User not found with this email address',
          variant: 'destructive',
        });
        return;
      }

      // Add collaborator
      const { error } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          user_id: userData.user_id,
          role: 'viewer',
          invited_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collaborator invited successfully',
      });

      setNewCollaboratorEmail('');
      await fetchProjectData();
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      toast({
        title: 'Error',
        description: 'Failed to invite collaborator',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collaborator removed successfully',
      });

      await fetchProjectData();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove collaborator',
        variant: 'destructive',
      });
    }
  };

  const handleChangeRole = async (collaboratorId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .update({ role: newRole })
        .eq('id', collaboratorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collaborator role updated successfully',
      });

      await fetchProjectData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update collaborator role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading project settings...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Project Not Found</h1>
          <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project/${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Settings</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Update your project details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="project-type">Project Type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="project-status">Status</Label>
                  <Select value={projectStatus} onValueChange={setProjectStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="project-location">Location</Label>
                  <Input
                    id="project-location"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    placeholder="Project location"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client or organization name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="project-notes">Project Notes</Label>
                <Textarea
                  id="project-notes"
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="Additional notes about the project"
                  rows={4}
                />
              </div>
              <Button onClick={handleSaveProject} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Collaborators Management */}
          <Card>
            <CardHeader>
              <CardTitle>Collaborators</CardTitle>
              <CardDescription>Manage who has access to this project</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Collaborator */}
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Enter email address"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInviteCollaborator()}
                />
                <Button onClick={handleInviteCollaborator} disabled={inviting}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {inviting ? 'Inviting...' : 'Invite'}
                </Button>
              </div>

              {/* Collaborators List */}
              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {collaborator.profiles?.display_name?.[0] || collaborator.profiles?.email?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {collaborator.profiles?.display_name || collaborator.profiles?.email || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground">{collaborator.profiles?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={collaborator.role === 'editor' ? 'default' : 'secondary'}>
                          {collaborator.role}
                        </Badge>
                        {!collaborator.accepted_at && (
                          <Badge variant="outline">
                            <Mail className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(collaborator.id, collaborator.role === 'editor' ? 'viewer' : 'editor')}
                        >
                          Change to {collaborator.role === 'editor' ? 'Viewer' : 'Editor'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="text-destructive"
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {collaborators.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No collaborators yet. Invite team members to get started.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      "{project.name}" and remove all associated data including collaborators and project versions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;