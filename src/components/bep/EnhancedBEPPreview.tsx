import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, FileText, Eye, RotateCw, Settings, Globe, CheckCircle, FileArchive, Layers, Code, Building, Users, MapPin, AlertCircle } from "lucide-react"
import { ProjectData } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import jsPDF from 'jspdf'
import { supabase } from "@/integrations/supabase/client"
import logoUrl from "@/assets/bimxplan-logo.png"
import { BEPDiagnostics } from "./BEPDiagnostics"
import { BEPTestResults } from "./BEPTestResults"

interface ValidationIssue {
  section: string
  field: string
  message: string
}

interface BEPPreviewProps {
  data?: Partial<ProjectData>
  onUpdate?: (data: any) => void
  projectData?: Partial<ProjectData>
  projectId?: string
  onSave?: () => Promise<void>
}

export function EnhancedBEPPreview({ data, projectData, projectId, onSave }: BEPPreviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const baseData = useMemo(() => data || projectData || {}, [data, projectData])
  const [previewData, setPreviewData] = useState<Partial<ProjectData>>(baseData)
  const { toast } = useToast()
  
  // Enhanced logging function
  const logAction = useCallback((action: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      action,
      projectId: projectId || 'undefined',
      hasAccess,
      dataSize: JSON.stringify(baseData).length,
      retryCount,
      ...data
    }
    console.log(`[BEP-${action}]`, logData)
    return logData
  }, [projectId, hasAccess, baseData, retryCount])

  // Data mapping layer to safely handle empty/undefined fields
  const safeMap = (obj: any, fallback = 'Not specified') => {
    if (obj === null || obj === undefined) return fallback
    if (typeof obj === 'boolean') return obj ? 'Yes' : 'No'
    if (typeof obj === 'string' && obj.trim() === '') return fallback
    if (Array.isArray(obj) && obj.length === 0) return fallback
    return obj
  }

  // Enhanced validation function
  const validateData = useCallback((data: Partial<ProjectData>): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    
    // Project Overview validation
    const overview = data?.project_overview
    if (!overview?.project_name) {
      issues.push({ section: "Project Overview", field: "project_name", message: "Project name is required" })
    }
    if (!overview?.client_name) {
      issues.push({ section: "Project Overview", field: "client_name", message: "Client name is required" })
    }
    
    // Team validation
    const team = data?.team_responsibilities
    if (!team?.firms || team.firms.length === 0) {
      issues.push({ section: "Team", field: "firms", message: "At least one firm must be defined" })
    }
    
    // Software validation
    const software = data?.software_overview
    if (!software?.main_tools || software.main_tools.length === 0) {
      issues.push({ section: "Software", field: "main_tools", message: "At least one main BIM tool must be defined" })
    }
    
    return issues
  }, [])

  const issues = useMemo(() => validateData(previewData), [validateData, previewData])

  // Enhanced refresh function
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      logAction('REFRESH_START', { retry: retryCount > 0, attempt: retryCount + 1 })
      
      // Check access first
      if (projectId) {
        logAction('ACCESS_CHECK_START')
        const { data: hasProjectAccess, error: accessError } = await supabase
          .rpc('user_can_access_project', { project_uuid: projectId })
        
        if (accessError) {
          logAction('ACCESS_CHECK_ERROR', { error: accessError.message })
          throw new Error(`Access check failed: ${accessError.message}`)
        }
        
        if (!hasProjectAccess) {
          logAction('ACCESS_CHECK_DENIED')
          setHasAccess(false)
          throw new Error('You do not have access to this project')
        }
        
        logAction('ACCESS_CHECK_SUCCESS')
        setHasAccess(true)
      }
      
      // Save current data first if onSave is available
      if (onSave) {
        logAction('REFRESH_SAVING')
        await onSave()
      }
      
      // Fetch fresh data from database
      if (projectId) {
        logAction('REFRESH_FETCHING_DB')
        const { data: freshProject, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        
        if (fetchError) {
          logAction('REFRESH_FETCH_ERROR', { error: fetchError.message })
          throw new Error(`Failed to fetch project: ${fetchError.message}`)
        }
        
        logAction('REFRESH_DATA_LOADED', {
          dataSize: JSON.stringify(freshProject?.project_data || {}).length,
          hasProjectData: !!freshProject?.project_data,
          projectName: freshProject?.name,
          projectStatus: freshProject?.status,
          lastUpdated: freshProject?.updated_at
        })
        
        if (freshProject?.project_data) {
          setPreviewData(freshProject.project_data as Partial<ProjectData>)
        }
      }
      
      setRetryCount(0)
      logAction('REFRESH_SUCCESS')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAction('REFRESH_ERROR', { error: errorMessage, retryCount })
      
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => handleRefresh(), 1000 * (retryCount + 1))
      } else {
        toast({
          title: "Refresh Failed",
          description: `${errorMessage}. Please try again or contact support.`,
          variant: "destructive",
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, retryCount, projectId, onSave, logAction, toast])

  // Enhanced PDF generation
  const generateComprehensivePDF = useCallback(async () => {
    if (exporting) return
    
    setExporting(true)
    try {
      const startTime = Date.now()
      logAction('PDF_EXPORT_START', { dataSize: JSON.stringify(previewData).length })
      
      // Create PDF with jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      let yPosition = 20
      const pageHeight = pdf.internal.pageSize.height
      const margin = 20
      
      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
          return true
        }
        return false
      }
      
      // Helper function to safely get text
      const safeText = (text: any, fallback = 'Not specified') => {
        if (text === null || text === undefined || text === '') return fallback
        if (typeof text === 'boolean') return text ? 'Yes' : 'No'
        if (Array.isArray(text)) return text.length > 0 ? text.join(', ') : fallback
        return String(text)
      }
      
      // PDF Header
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('BIM Execution Plan', margin, yPosition)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition + 8)
      
      yPosition = 40
      
      // Project Overview Section
      checkPageBreak(40)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('1. Project Overview', margin, yPosition)
      yPosition += 10
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const overview = previewData.project_overview
      pdf.text(`Project Name: ${safeText(overview?.project_name)}`, margin, yPosition)
      yPosition += 6
      pdf.text(`Client: ${safeText(overview?.client_name)}`, margin, yPosition)
      yPosition += 6
      pdf.text(`Location: ${safeText(overview?.location)}`, margin, yPosition)
      yPosition += 6
      pdf.text(`Project Type: ${safeText(overview?.project_type)}`, margin, yPosition)
      yPosition += 15
      
      // Team & Responsibilities Section
      checkPageBreak(30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('2. Team & Responsibilities', margin, yPosition)
      yPosition += 10
      
      const team = previewData.team_responsibilities
      if (team?.firms && team.firms.length > 0) {
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        team.firms.forEach((firm: any, index: number) => {
          checkPageBreak(20)
          pdf.text(`Firm ${index + 1}: ${safeText(firm.name)}`, margin, yPosition)
          yPosition += 5
          pdf.text(`  Discipline: ${safeText(firm.discipline)}`, margin + 5, yPosition)
          yPosition += 5
          pdf.text(`  BIM Lead: ${safeText(firm.bim_lead)}`, margin + 5, yPosition)
          yPosition += 5
          pdf.text(`  Contact: ${safeText(firm.contact_info)}`, margin + 5, yPosition)
          yPosition += 8
        })
      }
      yPosition += 10
      
      // Software Overview Section
      checkPageBreak(30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('3. Software Overview', margin, yPosition)
      yPosition += 10
      
      const software = previewData.software_overview
      if (software?.main_tools && software.main_tools.length > 0) {
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        software.main_tools.forEach((tool: any) => {
          checkPageBreak(6)
          pdf.text(`• ${safeText(tool.name)} ${safeText(tool.version)} - ${safeText(tool.discipline)}`, margin, yPosition)
          yPosition += 6
        })
      }
      yPosition += 15
      
      // Additional sections can be added here following the same pattern
      
      // Generate filename
      const projectName = overview?.project_name || 'BEP_Project'
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:\-T]/g, '_')
      const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_BEP_Summary_${timestamp}.pdf`
      
      // Download PDF
      pdf.save(filename)
      
      // Create version entry if projectId exists
      if (projectId) {
        try {
          logAction('VERSION_CREATE_START')
          const { error: versionError } = await supabase
            .from('project_versions')
            .insert({
              project_id: projectId,
              version_number: Math.floor(Date.now() / 1000),
              project_data: previewData,
              changelog: `BEP PDF Export: ${filename}`,
              created_by: (await supabase.auth.getUser()).data.user?.id
            })
          
          if (versionError) {
            logAction('VERSION_CREATE_ERROR', { error: versionError.message })
          } else {
            logAction('VERSION_CREATE_SUCCESS')
          }
        } catch (versionErr) {
          logAction('VERSION_CREATE_ERROR', { error: versionErr.message })
        }
      }
      
      const duration = Date.now() - startTime
      logAction('PDF_EXPORT_SUCCESS', { 
        duration,
        filename
      })
      
      toast({
        title: "PDF Generated Successfully",
        description: `${filename} has been downloaded`,
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAction('PDF_EXPORT_ERROR', { error: errorMessage })
      toast({
        title: "PDF Export Failed",
        description: `Failed to generate PDF: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }, [exporting, previewData, projectId, logAction, toast])

  // Live preview component
  const renderLivePreview = () => {
    return (
      <ScrollArea className="h-[600px] border rounded-lg p-6 bg-background">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">BIM Execution Plan</h1>
            <p className="text-muted-foreground">
              {previewData.project_overview?.project_name || 'Project Name Not Set'}
            </p>
          </div>

          {/* Project Overview */}
          {previewData.project_overview && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                1. Project Overview
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Project Name:</strong> {safeMap(previewData.project_overview.project_name)}</div>
                <div><strong>Client:</strong> {safeMap(previewData.project_overview.client_name)}</div>
                <div><strong>Location:</strong> {safeMap(previewData.project_overview.location)}</div>
                <div><strong>Type:</strong> {safeMap(previewData.project_overview.project_type)}</div>
              </div>
            </section>
          )}

          {/* Team & Responsibilities */}
          {previewData.team_responsibilities?.firms && previewData.team_responsibilities.firms.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                2. Team & Responsibilities
              </h2>
              <div className="space-y-3">
                {previewData.team_responsibilities.firms.map((firm: any, index: number) => (
                  <div key={index} className="border rounded p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Firm:</strong> {safeMap(firm.name)}</div>
                      <div><strong>Discipline:</strong> {safeMap(firm.discipline)}</div>
                      <div><strong>BIM Lead:</strong> {safeMap(firm.bim_lead)}</div>
                      <div><strong>Contact:</strong> {safeMap(firm.contact_info)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Software Overview */}
          {previewData.software_overview?.main_tools && previewData.software_overview.main_tools.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                3. Software Overview
              </h2>
              <div className="space-y-2">
                {previewData.software_overview.main_tools.map((tool: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                    <span><strong>{safeMap(tool.name)}</strong> {safeMap(tool.version)}</span>
                    <Badge variant="outline">{safeMap(tool.discipline)}</Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Summary Footer */}
          <div className="border-t pt-4 text-center text-sm text-muted-foreground">
            <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            {projectId && <p className="text-xs mt-1">Project ID: {projectId}</p>}
          </div>
        </div>
      </ScrollArea>
    )
  }

  // Update preview data when base data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewData(baseData)
    }, 300)
    return () => clearTimeout(timer)
  }, [baseData])

  return (
    <div className="space-y-6">
      {/* Status & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">BEP Preview & Export</h3>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Data Size: {JSON.stringify(previewData).length} chars</span>
            {issues.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {issues.length} validation issue{issues.length > 1 ? 's' : ''}
              </Badge>
            )}
            {hasAccess && (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Access Verified
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Preview'}
          </Button>
          
          <Button
            onClick={generateComprehensivePDF}
            disabled={exporting || !hasAccess}
            variant="default"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Generating PDF...' : 'Generate PDF'}
          </Button>
        </div>
      </div>

      {/* Validation Issues */}
      {issues.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Issues</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 mt-2">
              {issues.map((issue, index) => (
                <div key={index} className="text-sm">
                  <strong>{issue.section}:</strong> {issue.message}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Access Denied */}
      {!hasAccess && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view or export this BEP. Please contact the project owner.
          </AlertDescription>
        </Alert>
      )}

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Live Preview
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Auto-updates as you make changes
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderLivePreview()}
        </CardContent>
      </Card>

      {/* Diagnostics */}
      <BEPDiagnostics projectId={projectId} />
      
      {/* Test Results */}
      <BEPTestResults results={[]} />
    </div>
  )
}