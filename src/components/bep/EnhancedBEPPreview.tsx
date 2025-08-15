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
import { getBepExportData, ensureLatestSave, BEPExportData, ValidationIssue, validateBepData } from "./BEPDataCollector"
import { mapProjectDataToPdfModel, PdfModel } from "./BEPPdfMapper"
import { renderPdfFromModel, generatePdfFilename, createVersionEntry } from "./BEPPdfRenderer"
import { bepErrorHandler } from "./BEPErrorHandler"

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
  const [exportData, setExportData] = useState<BEPExportData | null>(null)
  const { toast } = useToast()
  
  // Enhanced logging function using centralized error handler
  const logAction = useCallback((action: string, data?: any) => {
    const context = {
      projectId: projectId || 'undefined',
      hasAccess,
      dataSize: JSON.stringify(baseData).length,
      retryCount,
      ...data
    }
    bepErrorHandler.log('info', action, `BEP Preview: ${action}`, context)
    return context
  }, [projectId, hasAccess, baseData, retryCount])

  // Data mapping layer to safely handle empty/undefined fields
  const safeMap = (obj: any, fallback = 'Not specified') => {
    if (obj === null || obj === undefined) return fallback
    if (typeof obj === 'boolean') return obj ? 'Yes' : 'No'
    if (typeof obj === 'string' && obj.trim() === '') return fallback
    if (Array.isArray(obj) && obj.length === 0) return fallback
    return obj
  }

  // Use centralized validation function
  const validateData = useCallback((data: Partial<ProjectData>): ValidationIssue[] => {
    return validateBepData(data)
  }, [])

  const issues = useMemo(() => validateData(previewData), [validateData, previewData])

  // Enhanced refresh function with single source of truth
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !projectId) return
    
    setIsRefreshing(true)
    try {
      logAction('REFRESH_START', { retry: retryCount > 0, attempt: retryCount + 1 })
      
      // Save current data first if onSave is available
      if (onSave) {
        logAction('REFRESH_SAVING')
        await onSave()
      }

      // Use single source of truth for data collection
      logAction('REFRESH_FETCHING_UNIFIED_DATA')
      const freshExportData = await getBepExportData(projectId)
      
      logAction('REFRESH_DATA_LOADED', {
        dataSize: JSON.stringify(freshExportData).length,
        sectionsFound: Object.keys(freshExportData.sections).length,
        lastUpdated: freshExportData.lastUpdated
      })
      
      // Update both preview data and export data
      setExportData(freshExportData)
      
      // Convert export data back to preview format for compatibility
      const previewCompatibleData: Partial<ProjectData> = {
        project_overview: freshExportData.sections.overview,
        team_responsibilities: freshExportData.sections.team,
        software_overview: freshExportData.sections.software,
        modeling_scope: freshExportData.sections.modeling,
        file_naming: freshExportData.sections.naming,
        collaboration_cde: freshExportData.sections.collaboration,
        geolocation: freshExportData.sections.geolocation,
        model_checking: freshExportData.sections.checking,
        outputs_deliverables: freshExportData.sections.outputs
      }
      
      setPreviewData(previewCompatibleData)
      setHasAccess(true)
      setRetryCount(0)
      logAction('REFRESH_SUCCESS')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAction('REFRESH_ERROR', { error: errorMessage, retryCount })
      
      if (errorMessage.includes('access')) {
        setHasAccess(false)
      }
      
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

  // Enhanced PDF generation with soft-gating validation
  const generateComprehensivePDF = useCallback(async () => {
    if (exporting || !projectId) return
    
    // Check for critical errors and show confirmation dialog
    const criticalErrors = issues.filter(i => i.severity === 'error')
    if (criticalErrors.length > 0) {
      const shouldProceed = window.confirm(
        `Some required fields are missing (${criticalErrors.length} error${criticalErrors.length !== 1 ? 's' : ''}).\n\nGenerate PDF anyway?`
      )
      if (!shouldProceed) return
    }
    
    setExporting(true)
    try {
      const startTime = Date.now()
      logAction('PDF_EXPORT_START', { 
        criticalErrors: criticalErrors.length,
        totalIssues: issues.length 
      })
      
      // Step 1: Ensure latest save (flush any pending changes)
      if (onSave) {
        logAction('PDF_ENSURE_SAVE')
        await ensureLatestSave(projectId, previewData)
      }
      
      // Step 2: Collect fresh data using single source of truth
      logAction('PDF_COLLECT_DATA')
      const freshExportData = await getBepExportData(projectId)
      
      // Step 3: Map to clean PDF model
      logAction('PDF_MAP_DATA')
      const pdfModel = mapProjectDataToPdfModel(freshExportData)
      
      // Step 4: Generate PDF using mapped model
      logAction('PDF_RENDER_START')
      const pdf = await renderPdfFromModel(pdfModel, projectId)
      
      // Step 5: Download PDF
      const filename = generatePdfFilename(pdfModel.header.projectName)
      pdf.save(filename)
      
      // Step 6: Create version entry
      await createVersionEntry(projectId, freshExportData, filename)
      
      const duration = Date.now() - startTime
      logAction('PDF_EXPORT_SUCCESS', { 
        duration,
        filename,
        sectionsIncluded: Object.keys(pdfModel.sections).length,
        exportedWithErrors: criticalErrors.length > 0
      })
      
      toast({
        title: "PDF Generated Successfully",
        description: criticalErrors.length > 0 
          ? `${filename} generated with incomplete data` 
          : `${filename} has been downloaded`,
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
  }, [exporting, projectId, previewData, onSave, logAction, toast, issues])

  // Complete Live Preview component using export data source
  const renderLivePreview = () => {
    // Type-safe access to both export data and preview data
    const getProjectOverview = () => exportData?.sections.overview || (previewData as Partial<ProjectData>).project_overview
    const getTeamData = () => exportData?.sections.team || (previewData as Partial<ProjectData>).team_responsibilities
    const getSoftwareData = () => exportData?.sections.software || (previewData as Partial<ProjectData>).software_overview
    const getModelingData = () => exportData?.sections.modeling || (previewData as Partial<ProjectData>).modeling_scope
    const getNamingData = () => exportData?.sections.naming || (previewData as Partial<ProjectData>).file_naming
    const getCollaborationData = () => exportData?.sections.collaboration || (previewData as Partial<ProjectData>).collaboration_cde
    const getGeolocationData = () => exportData?.sections.geolocation || (previewData as Partial<ProjectData>).geolocation
    const getCheckingData = () => exportData?.sections.checking || (previewData as Partial<ProjectData>).model_checking
    const getOutputsData = () => exportData?.sections.outputs || (previewData as Partial<ProjectData>).outputs_deliverables
    
    return (
      <ScrollArea className="h-[600px] border rounded-lg p-6 bg-background">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">BIM Execution Plan</h1>
            <p className="text-muted-foreground">
              {exportData?.projectName || getProjectOverview()?.project_name || 'Project Name Not Set'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Last Updated: {exportData?.lastUpdated ? new Date(exportData.lastUpdated).toLocaleString() : 'Not saved'}
            </p>
          </div>

          {/* 1. Project Overview */}
          {getProjectOverview() && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                1. Project Overview
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Project Name:</strong> {safeMap(getProjectOverview()?.project_name, '—')}</div>
                <div><strong>Client:</strong> {safeMap(getProjectOverview()?.client_name, '—')}</div>
                <div><strong>Location:</strong> {safeMap(getProjectOverview()?.location, '—')}</div>
                <div><strong>Type:</strong> {safeMap(getProjectOverview()?.project_type, '—')}</div>
              </div>
              {getProjectOverview()?.key_milestones?.length > 0 && (
                <div className="mt-4">
                  <strong className="text-sm">Key Milestones:</strong>
                  <div className="space-y-1 mt-2">
                    {(getProjectOverview()?.key_milestones || []).map((milestone: any, index: number) => (
                      <div key={index} className="text-sm pl-4 border-l-2 border-blue-200">
                        <div className="font-medium">{milestone.name || '—'}</div>
                        <div className="text-muted-foreground text-xs">{milestone.date || '—'} • {milestone.description || 'No description'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 2. Team & Responsibilities */}
          {getTeamData()?.firms?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                2. Team & Responsibilities
              </h2>
              <div className="space-y-3">
                {(getTeamData()?.firms || []).map((firm: any, index: number) => (
                  <div key={index} className="border rounded p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Firm:</strong> {safeMap(firm.name, '—')}</div>
                      <div><strong>Discipline:</strong> {safeMap(firm.discipline, '—')}</div>
                      <div><strong>BIM Lead:</strong> {safeMap(firm.bim_lead, '—')}</div>
                      <div><strong>Contact:</strong> {safeMap(firm.contact_info, '—')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Software Overview */}
          {getSoftwareData()?.main_tools?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                3. Software Overview
              </h2>
              <div className="space-y-2">
                <div>
                  <strong className="text-sm">Main BIM Tools:</strong>
                  <div className="space-y-1 mt-2">
                    {(getSoftwareData()?.main_tools || []).map((tool: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                        <span><strong>{safeMap(tool.name, '—')}</strong> {safeMap(tool.version, '')}</span>
                        <Badge variant="outline">{safeMap(tool.discipline, '—')}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                {getSoftwareData()?.team_specific_tools?.length > 0 && (
                  <div className="mt-4">
                    <strong className="text-sm">Team-Specific Tools:</strong>
                    <div className="space-y-1 mt-2">
                      {(getSoftwareData()?.team_specific_tools || []).map((tool: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                          <span><strong>{safeMap(tool.name, '—')}</strong> {safeMap(tool.version, '')}</span>
                          <Badge variant="outline">{safeMap(tool.discipline, '—')}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 4. Modeling Scope & LOD */}
          {getModelingData() && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                4. Modeling Scope & LOD
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>General LOD:</strong> {safeMap(getModelingData()?.general_lod, '—')}</div>
                <div><strong>Units:</strong> {safeMap(getModelingData()?.units, '—')}</div>
                <div className="col-span-2"><strong>Datum Strategy:</strong> {safeMap(getModelingData()?.levels_grids_strategy, '—')}</div>
              </div>
              {getModelingData()?.discipline_lods?.length > 0 && (
                <div className="mt-4">
                  <strong className="text-sm">Discipline-Specific LODs:</strong>
                  <div className="space-y-1 mt-2">
                    {(getModelingData()?.discipline_lods || []).map((lod: any, index: number) => (
                      <div key={index} className="text-sm pl-4 border-l-2 border-green-200">
                        <span className="font-medium">{lod.discipline || '—'}</span>: {lod.lod_level || '—'}
                        {lod.description && <div className="text-muted-foreground text-xs">{lod.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 5. File Naming */}
          {getNamingData() && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                5. File Naming Conventions
              </h2>
              <div className="text-sm space-y-2">
                <div><strong>Use Conventions:</strong> {safeMap(getNamingData()?.use_conventions, '—')}</div>
                <div><strong>Prefix Format:</strong> {safeMap(getNamingData()?.prefix_format, '—')}</div>
                <div><strong>Discipline Codes:</strong> {safeMap(getNamingData()?.discipline_codes, '—')}</div>
                <div><strong>Versioning Format:</strong> {safeMap(getNamingData()?.versioning_format, '—')}</div>
              </div>
            </section>
          )}

          {/* 6. Collaboration & CDE */}
          {getCollaborationData() && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                6. Collaboration & CDE
              </h2>
              <div className="text-sm space-y-2">
                <div><strong>Platform:</strong> {safeMap(getCollaborationData()?.platform, '—')}</div>
                <div><strong>File Linking Method:</strong> {safeMap(getCollaborationData()?.file_linking_method, '—')}</div>
                <div><strong>Sharing Frequency:</strong> {safeMap(getCollaborationData()?.sharing_frequency, '—')}</div>
                <div><strong>Setup Responsibility:</strong> {safeMap(getCollaborationData()?.setup_responsibility, '—')}</div>
              </div>
            </section>
          )}

          {/* 7. Geolocation & Coordinates */}
          {getGeolocationData() && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                7. Geolocation & Coordinates
              </h2>
              <div className="text-sm space-y-2">
                <div><strong>Georeferenced:</strong> {safeMap(getGeolocationData()?.is_georeferenced, '—')}</div>
                <div><strong>Coordinate Setup:</strong> {safeMap(getGeolocationData()?.coordinate_setup, '—')}</div>
                <div><strong>Origin Location:</strong> {safeMap(getGeolocationData()?.origin_location, '—')}</div>
                <div><strong>Coordinate System:</strong> {safeMap(getGeolocationData()?.coordinate_system, '—')}</div>
              </div>
            </section>
          )}

          {/* 8. Model Checking & Coordination */}
          {getCheckingData() && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                8. Model Checking & Coordination
              </h2>
              <div className="text-sm space-y-2">
                <div><strong>Clash Detection Tools:</strong> {(getCheckingData()?.clash_detection_tools || []).join(', ') || '—'}</div>
                <div><strong>Coordination Process:</strong> {safeMap(getCheckingData()?.coordination_process, '—')}</div>
                <div><strong>Meeting Frequency:</strong> {safeMap(getCheckingData()?.meeting_frequency, '—')}</div>
                <div><strong>Responsibility Matrix:</strong> {safeMap(getCheckingData()?.responsibility_matrix, '—')}</div>
              </div>
            </section>
          )}

          {/* 9. Outputs & Deliverables */}
          {getOutputsData() && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <FileArchive className="h-5 w-5 mr-2" />
                9. Outputs & Deliverables
              </h2>
              {getOutputsData()?.deliverables_by_phase?.length > 0 && (
                <div className="space-y-3">
                  <strong className="text-sm">Deliverables by Phase:</strong>
                  {(getOutputsData()?.deliverables_by_phase || []).map((phase: any, index: number) => (
                    <div key={index} className="border rounded p-3">
                      <div className="font-medium text-sm">{phase.phase || '—'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <div>Deliverables: {(phase.deliverables || []).join(', ') || '—'}</div>
                        <div>Formats: {(phase.formats || []).join(', ') || '—'}</div>
                        <div>Responsibility: {phase.responsibility || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Export Meta Information */}
          <section className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Export Information
            </h2>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>Generated: {new Date().toLocaleString()}</div>
              {projectId && <div>Project ID: {projectId}</div>}
              {exportData && <div>Data Size: {JSON.stringify(exportData).length} characters</div>}
              {exportData && <div>Sections: {Object.keys(exportData.sections).length}</div>}
              {exportData?.validationIssues && <div>Validation Issues: {exportData.validationIssues.length}</div>}
            </div>
          </section>
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
              <Badge variant={issues.some(i => i.severity === 'error') ? "destructive" : "secondary"} className="text-xs">
                {issues.filter(i => i.severity === 'error').length} error{issues.filter(i => i.severity === 'error').length !== 1 ? 's' : ''}
                {issues.filter(i => i.severity === 'warning').length > 0 && `, ${issues.filter(i => i.severity === 'warning').length} warning${issues.filter(i => i.severity === 'warning').length !== 1 ? 's' : ''}`}
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
        <Alert variant={issues.some(i => i.severity === 'error') ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {issues.some(i => i.severity === 'error') ? 'Validation Errors' : 'Validation Warnings'}
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {issues.filter(i => i.severity === 'error').map((issue, index) => (
                <div key={`error-${index}`} className="text-sm p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                  <strong className="text-destructive">{issue.section}:</strong> {issue.message}
                </div>
              ))}
              {issues.filter(i => i.severity === 'warning').map((issue, index) => (
                <div key={`warning-${index}`} className="text-sm p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                  <strong className="text-yellow-700">{issue.section}:</strong> {issue.message}
                </div>
              ))}
              {issues.some(i => i.severity === 'error') && (
                <div className="text-sm text-muted-foreground mt-2">
                  <strong>Note:</strong> PDF can be generated with incomplete data. A confirmation dialog will appear if errors exist.
                </div>
              )}
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