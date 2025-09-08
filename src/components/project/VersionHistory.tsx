import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { History, Clock, User, FileText, RotateCcw, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'

interface ProjectVersion {
  id: string
  version_number: number
  project_data: Record<string, unknown>
  changelog: string | null
  created_at: string
  created_by: string
  profiles?: {
    display_name: string
    email: string
  }
}

interface VersionHistoryProps {
  projectId: string
  onRestore?: (versionData: Record<string, unknown>) => void
}

export function VersionHistory({ projectId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [showChangelogDialog, setShowChangelogDialog] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null)
  const [changelogText, setChangelogText] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchVersionHistory()
  }, [projectId, fetchVersionHistory])

  const fetchVersionHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })

      if (error) throw error
      setVersions(data || [])
    } catch (error: Error | unknown) {
      toast({
        title: "Error loading version history",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, toast])

  const handleRestore = async (version: ProjectVersion) => {
    if (!onRestore) return

    try {
      onRestore(version.project_data)
      toast({
        title: "Version Restored",
        description: `Restored to version ${version.version_number} successfully.`,
      })
    } catch (error: Error | unknown) {
      toast({
        title: "Error restoring version",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      })
    }
  }

  const handleUpdateChangelog = async () => {
    if (!selectedVersion) return

    try {
      const { error } = await supabase
        .from('project_versions')
        .update({ changelog: changelogText })
        .eq('id', selectedVersion.id)

      if (error) throw error

      setVersions(prev => prev.map(v => 
        v.id === selectedVersion.id ? { ...v, changelog: changelogText } : v
      ))

      setShowChangelogDialog(false)
      setSelectedVersion(null)
      setChangelogText('')

      toast({
        title: "Changelog Updated",
        description: "Version changelog has been updated successfully.",
      })
    } catch (error: Error | unknown) {
      toast({
        title: "Error updating changelog",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      })
    }
  }

  const openChangelogDialog = (version: ProjectVersion) => {
    setSelectedVersion(version)
    setChangelogText(version.changelog || '')
    setShowChangelogDialog(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading version history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Version History
            </div>
            <Badge variant="outline">{versions.length} versions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No versions yet</h3>
              <p className="text-muted-foreground">
                Versions will appear here as you save changes to your project.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div key={version.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          v{version.version_number}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openChangelogDialog(version)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {index > 0 && onRestore && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(version)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {version.profiles?.display_name || version.profiles?.email || 'Unknown'}
                      </div>
                    </div>
                    
                    {version.changelog && (
                      <p className="text-sm bg-muted p-2 rounded mt-2">{version.changelog}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Changelog Dialog */}
      <Dialog open={showChangelogDialog} onOpenChange={setShowChangelogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.version_number} Changelog
            </DialogTitle>
            <DialogDescription>
              Add or edit notes about what changed in this version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="changelog">Changelog Notes</Label>
              <Textarea
                id="changelog"
                value={changelogText}
                onChange={(e) => setChangelogText(e.target.value)}
                placeholder="Describe what changed in this version..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowChangelogDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateChangelog}>
                Save Changelog
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}