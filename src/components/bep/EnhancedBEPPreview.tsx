import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, FileText, Eye, Calendar, Users, Building, MapPin, RotateCw, Settings, Globe, CheckCircle, FileArchive, Layers, Code } from "lucide-react"
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
  const [showPreview, setShowPreview] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [hasAccess, setHasAccess] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const baseData = useMemo(() => data || projectData || {}, [data, projectData])
  const [previewData, setPreviewData] = useState<Partial<ProjectData>>(baseData)
  
  // Enhanced logging function with user role detection
  const logAction = (action: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      action,
      projectId: projectId || 'undefined',
      hasAccess,
      payloadSize: JSON.stringify(baseData).length,
      retryCount,
      userRole: 'unknown', // Will be enhanced below
      validationIssues: issues?.length || 0,
      ...data
    }
    console.log(`[BEP-${action}]`, logData)
    return logData
  }

  // Data mapping layer to safely handle empty/undefined fields
  const safeMap = (obj: any, fallback = '') => {
    if (obj === null || obj === undefined) return fallback
    if (typeof obj === 'boolean') return obj ? 'Yes' : 'No'
    if (typeof obj === 'string' && obj.trim() === '') return fallback
    if (Array.isArray(obj) && obj.length === 0) return fallback
    return obj
  }

  const mapDataForTemplate = (data: Partial<ProjectData>) => {
    // Create safe mapped version of data with no undefined/empty placeholders
    const mapped = JSON.parse(JSON.stringify(data)) // Deep clone
    
    // Recursively replace empty values
    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.filter(item => item != null).map(cleanObject)
      }
      if (obj && typeof obj === 'object') {
        const cleaned: any = {}
        for (const [key, value] of Object.entries(obj)) {
          if (value != null && value !== '' && value !== false) {
            cleaned[key] = cleanObject(value)
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined
      }
      return obj
    }
    
    return cleanObject(mapped) || {}
  }
  
  // Debounced update effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewData(baseData)
    }, 300)
    return () => clearTimeout(timer)
  }, [baseData])

  const { toast } = useToast()

  // Enhanced access check with user role detection
  useEffect(() => {
    const checkAccess = async () => {
      if (!projectId) return
      
      const startTime = Date.now()
      logAction('ACCESS_CHECK_START')
      
      try {
        // Get user info first
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          logAction('ACCESS_CHECK_NO_USER')
          setHasAccess(false)
          toast({ title: 'Authentication Required', description: 'Please log in to access projects', variant: 'destructive' })
          return
        }

        // Check project access
        const { data, error } = await supabase.rpc('user_can_access_project', { project_uuid: projectId })
        if (error) {
          logAction('ACCESS_CHECK_ERROR', { error: error.message, code: error.code })
          throw new Error(`RPC Error: ${error.message}`)
        }
        
        // Determine user role
        let userRole = 'unknown'
        if (data) {
          const { data: project } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .maybeSingle()
          
          if (project?.owner_id === user.user.id) {
            userRole = 'owner'
          } else {
            const { data: collab } = await supabase
              .from('project_collaborators')
              .select('role')
              .eq('project_id', projectId)
              .eq('user_id', user.user.id)
              .eq('accepted_at', 'IS NOT NULL')
              .maybeSingle()
            userRole = collab?.role || 'collaborator'
          }
        }
        
        const duration = Date.now() - startTime
        setHasAccess(!!data)
        logAction('ACCESS_CHECK_SUCCESS', { 
          hasAccess: !!data, 
          duration, 
          userRole,
          userId: user.user.id,
          userEmail: user.user.email 
        })
        
        if (!data) {
          toast({ 
            title: 'Access Denied', 
            description: 'You do not have permission to view this project.',
            variant: 'destructive' 
          })
        }
      } catch (error) {
        const duration = Date.now() - startTime
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        logAction('ACCESS_CHECK_FAILED', { error: errorMsg, duration })
        setHasAccess(false)
        toast({ 
          title: 'Access Check Failed', 
          description: `Could not verify project permissions: ${errorMsg}`,
          variant: 'destructive' 
        })
      }
    }
    checkAccess()
  }, [projectId, toast])

  const validateData = (d: Partial<ProjectData>): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    
    // Check if data is completely empty
    if (!d || Object.keys(d).length === 0) {
      issues.push({ section: 'Data', field: 'any', message: 'No project data available - please fill out the BEP form first' })
      return issues
    }
    
    // Project Overview required
    if (!d.project_overview?.project_name) issues.push({ section: 'Project Overview', field: 'project_name', message: 'Project name is required' })
    if (!d.project_overview?.location) issues.push({ section: 'Project Overview', field: 'location', message: 'Location is required' })
    if (!d.project_overview?.client_name) issues.push({ section: 'Project Overview', field: 'client_name', message: 'Client name is required' })

    // Team basics (optional but recommended)
    if (d.team_responsibilities?.firms?.length) {
      d.team_responsibilities.firms.forEach((f, idx) => {
        if (!f.name) issues.push({ section: 'Team & Responsibilities', field: `firms[${idx}].name`, message: 'Firm name missing' })
        if (!f.bim_lead) issues.push({ section: 'Team & Responsibilities', field: `firms[${idx}].bim_lead`, message: 'BIM lead missing' })
      })
    }
    
    logAction('VALIDATION_COMPLETE', { issueCount: issues.length, issues: issues.slice(0, 3) })
    return issues
  }

  const issues = useMemo(() => validateData(previewData), [previewData])

  const generateMarkdown = (data: Partial<ProjectData>): string => {
    const cleanData = mapDataForTemplate(data)
    logAction('MARKDOWN_GENERATION_START', { cleanDataSize: JSON.stringify(cleanData).length })
    
    let md = `# BIM Execution Plan\n\n`

    if (cleanData.project_overview) {
      md += `## Project Overview\n\n`
      const po = cleanData.project_overview
      if (po.project_name) md += `**Project Name:** ${safeMap(po.project_name)}\n`
      if (po.location) md += `**Location:** ${safeMap(po.location)}\n`
      if (po.client_name) md += `**Client:** ${safeMap(po.client_name)}\n`
      if (po.project_type) md += `**Project Type:** ${safeMap(po.project_type)}\n\n`
      if (po.key_milestones?.length) {
        md += `### Key Milestones\n\n`
        po.key_milestones.forEach(m => {
          const parts = [safeMap(m.name), safeMap(m.date)].filter(p => p !== '').join(' - ')
          if (parts) md += `- ${parts}${m.description ? `: ${safeMap(m.description)}` : ''}\n`
        })
        md += `\n`
      }
    }

    if (data.team_responsibilities?.firms?.length) {
      md += `## Team & Responsibilities\n\n`
      data.team_responsibilities.firms.forEach(f => {
        if (f.name) md += `### ${f.name}\n`
        if (f.discipline) md += `- **Discipline:** ${f.discipline}\n`
        if (f.bim_lead) md += `- **BIM Lead:** ${f.bim_lead}\n`
        if (f.contact_info) md += `- **Contact:** ${f.contact_info}\n`
        md += `\n`
      })
    }

    if (data.software_overview?.main_tools?.length) {
      md += `## Software Overview\n\n### Main Tools\n\n`
      data.software_overview.main_tools.forEach(t => {
        const name = t.name ? `**${t.name}**` : ''
        const version = t.version ? ` (${t.version})` : ''
        const disc = t.discipline ? ` - ${t.discipline}` : ''
        const usage = t.usage ? `: ${t.usage}` : ''
        const line = `${name}${version}${disc}${usage}`
        if (name) md += `- ${line}\n`
      })
      md += `\n`
    }

    if (data.modeling_scope) {
      md += `## Modeling Scope\n\n`
      const ms = data.modeling_scope
      if (ms.general_lod) md += `**General LOD:** ${ms.general_lod}\n`
      if (ms.units) md += `**Units:** ${ms.units}\n`
      if (ms.levels_grids_strategy) md += `**Levels/Grids Strategy:** ${ms.levels_grids_strategy}\n\n`
      if (ms.discipline_lods?.length) {
        md += `### Discipline-Specific LODs\n\n`
        ms.discipline_lods.forEach(l => {
          const parts = [l.discipline, l.lod_level].filter(Boolean).join(': ')
          const line = `${parts}${l.description ? ` - ${l.description}` : ''}`
          if (parts) md += `- ${line}\n`
        })
        md += `\n`
      }
    }

    if (data.file_naming) {
      md += `## File Naming Convention\n\n`
      const fn = data.file_naming
      if (typeof fn.use_conventions === 'boolean') md += `**Use Standard Conventions:** ${fn.use_conventions ? 'Yes' : 'No'}\n`
      if (fn.prefix_format) md += `**Prefix Format:** ${fn.prefix_format}\n`
      if (fn.discipline_codes) md += `**Discipline Codes:** ${fn.discipline_codes}\n`
      if (fn.versioning_format) md += `**Versioning Format:** ${fn.versioning_format}\n\n`
    }

    if (data.collaboration_cde) {
      md += `## Collaboration & Common Data Environment\n\n`
      const cde = data.collaboration_cde
      if (cde.platform) md += `**Platform:** ${cde.platform}\n`
      if (cde.file_linking_method) md += `**File Linking Method:** ${cde.file_linking_method}\n`
      if (cde.sharing_frequency) md += `**Sharing Frequency:** ${cde.sharing_frequency}\n`
      if (cde.setup_responsibility) md += `**Setup Responsibility:** ${cde.setup_responsibility}\n\n`
    }

    if (data.geolocation) {
      md += `## Geolocation & Coordinate System\n\n`
      const geo = data.geolocation
      if (typeof geo.is_georeferenced === 'boolean') md += `**Georeferenced:** ${geo.is_georeferenced ? 'Yes' : 'No'}\n`
      if (geo.is_georeferenced) {
        if (geo.coordinate_setup) md += `**Coordinate Setup:** ${geo.coordinate_setup}\n`
        if (geo.origin_location) md += `**Origin Location:** ${geo.origin_location}\n`
        if (geo.coordinate_system) md += `**Coordinate System:** ${geo.coordinate_system}\n`
      }
      md += `\n`
    }

    if (data.model_checking) {
      md += `## Model Checking & Coordination\n\n`
      const mc = data.model_checking
      if (mc.clash_detection_tools?.length) md += `**Clash Detection Tools:** ${mc.clash_detection_tools.join(', ')}\n`
      if (mc.coordination_process) md += `**Coordination Process:** ${mc.coordination_process}\n`
      if (mc.meeting_frequency) md += `**Meeting Frequency:** ${mc.meeting_frequency}\n\n`
    }

    if (data.outputs_deliverables?.deliverables_by_phase?.length) {
      md += `## Outputs & Deliverables\n\n### Deliverables by Phase\n\n`
      data.outputs_deliverables.deliverables_by_phase.forEach(p => {
        if (!p.phase) return
        md += `#### ${p.phase}\n`
        if (p.deliverables?.length) md += `- **Deliverables:** ${p.deliverables.join(', ')}\n`
        if (p.formats?.length) md += `- **Formats:** ${p.formats.join(', ')}\n`
        if (p.responsibility) md += `- **Responsibility:** ${p.responsibility}\n\n`
      })
    }

    md += `---\n\n*Generated by BIMxPlan Go on ${new Date().toLocaleDateString()}*\n`
    return md
  }

  const refreshPreview = useCallback(async (retry = false) => {
    if (!hasAccess && projectId) {
      logAction('REFRESH_BLOCKED', { reason: 'no_access' })
      toast({ 
        title: 'Access Required', 
        description: 'You need permission to refresh this project preview',
        variant: 'destructive' 
      })
      return
    }
    
    const startTime = Date.now()
    logAction('REFRESH_START', { retry, attempt: retry ? retryCount + 1 : 1 })
    setIsRefreshing(true)
    
    try {
      // Save first if possible
      if (onSave) {
        logAction('REFRESH_SAVING')
        await onSave()
      }
      
      let latest = baseData
      
      if (projectId) {
        logAction('REFRESH_FETCHING_DB')
        // Enhanced timeout and error handling
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database request timeout after 10 seconds')), 10000)
        )
        
        const dataPromise = supabase
          .from('projects')
          .select('project_data,id,name,owner_id,status,updated_at')
          .eq('id', projectId)
          .maybeSingle()
        
        const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any
        
        if (error) {
          const enhancedError = `Database error: ${error.message}${error.code ? ` (${error.code})` : ''}`
          logAction('REFRESH_DB_ERROR', { 
            error: error.message, 
            code: error.code,
            hint: error.hint,
            details: error.details 
          })
          throw new Error(enhancedError)
        }
        
        if (!data) {
          logAction('REFRESH_NO_DATA', { projectId })
          throw new Error(`Project with ID ${projectId} not found or no access`)
        }
        
        latest = (data?.project_data as Partial<ProjectData>) || {}
        const dataValid = Object.keys(latest).length > 0
        
        logAction('REFRESH_DATA_LOADED', { 
          dataSize: JSON.stringify(latest).length, 
          hasProjectData: dataValid,
          projectName: data.name,
          projectStatus: data.status,
          lastUpdated: data.updated_at
        })
      }
      
      setPreviewData(latest)
      setRetryCount(0)
      
      const duration = Date.now() - startTime
      const dataValid = Object.keys(latest).length > 0
      logAction('REFRESH_SUCCESS', { duration, dataValid })
      
      if (!dataValid) {
        toast({ 
          title: 'No project data found', 
          description: 'Please fill out the BEP form first to generate a preview.',
          variant: 'default'
        })
      } else {
        toast({ 
          title: 'Preview updated successfully', 
          description: `Loaded ${Object.keys(latest).length} data sections`
        })
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logAction('REFRESH_ERROR', { error: errorMsg, duration, retry, retryCount })
      
      // Enhanced retry logic with exponential backoff
      if (!retry && retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        setRetryCount(prev => prev + 1)
        toast({ 
          title: `Retrying in ${delay/1000}s...`, 
          description: `Attempt ${retryCount + 1}/3: ${errorMsg.substring(0, 50)}${errorMsg.length > 50 ? '...' : ''}` 
        })
        setTimeout(() => refreshPreview(true), delay)
        return
      }
      
      // Final failure with actionable message
      const isTimeout = errorMsg.includes('timeout')
      const isPermission = errorMsg.includes('access') || errorMsg.includes('permission')
      
      toast({ 
        title: 'Preview refresh failed', 
        description: isTimeout 
          ? 'Request timed out. Check your connection and try again.' 
          : isPermission 
          ? 'Permission denied. Contact project owner.'
          : `Error: ${errorMsg}. Please try again.`,
        variant: 'destructive' 
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [hasAccess, projectId, onSave, baseData, retryCount, toast])

  const generatePDF = async () => {
    if (!hasAccess && projectId) {
      logAction('PDF_BLOCKED', { reason: 'no_access' })
      toast({ 
        title: 'Access Denied', 
        description: 'You do not have permission to export this project.',
        variant: 'destructive' 
      })
      return
    }

    const startTime = Date.now()
    logAction('PDF_EXPORT_START')
    setExporting(true)
    const exportStartedAt = new Date()
    
    try {
      // Save current state first
      if (onSave) {
        logAction('PDF_SAVING_FIRST')
        await onSave()
      }

      // Fetch freshest data from DB to avoid stale content
      let exportData: Partial<ProjectData> = previewData
      let projectName = 'BEP_Export'
      
      if (projectId) {
        logAction('PDF_FETCHING_DATA')
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF export timeout after 15 seconds')), 15000)
        )
        
        const dataPromise = supabase
          .from('projects')
          .select('project_data,id,name,owner_id,status')
          .eq('id', projectId)
          .maybeSingle()
        
        const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any
        
        if (error) {
          const enhancedError = `Database error: ${error.message}${error.code ? ` (${error.code})` : ''}`
          logAction('PDF_DB_ERROR', { 
            error: error.message, 
            code: error.code,
            hint: error.hint 
          })
          throw new Error(enhancedError)
        }
        
        if (!data) {
          logAction('PDF_NO_PROJECT', { projectId })
          throw new Error(`Project with ID ${projectId} not found`)
        }
        
        exportData = (data?.project_data as Partial<ProjectData>) || {}
        projectName = data.name || 'BEP_Export'
        
        logAction('PDF_DATA_LOADED', { 
          dataSize: JSON.stringify(exportData).length,
          hasData: Object.keys(exportData).length > 0,
          projectName,
          projectStatus: data.status
        })
      }

      // Enhanced validation with detailed logging
      const currentIssues = validateData(exportData)
      if (currentIssues.length > 0) {
        logAction('PDF_VALIDATION_FAILED', { 
          issueCount: currentIssues.length,
          criticalIssues: currentIssues.slice(0, 3)
        })
        
        const criticalList = currentIssues.slice(0, 3).map(i => `${i.section}: ${i.message}`).join(' • ')
        const additionalCount = currentIssues.length > 3 ? ` and ${currentIssues.length - 3} more` : ''
        
        toast({ 
          title: 'Cannot generate PDF', 
          description: `${criticalList}${additionalCount}. Please complete the BEP form.`,
          variant: 'destructive' 
        })
        return
      }
      
      // Clean data for PDF template
      const cleanExportData = mapDataForTemplate(exportData)
      logAction('PDF_GENERATING', { cleanDataKeys: Object.keys(cleanExportData) })

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 18
      let y = margin

      // Helpers
      const lineHeight = 5
      // Load logo once for header (optional)
      const getImageDataUrl = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url)
          const blob = await res.blob()
          return await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
          })
        } catch {
          return null
        }
      }
      const logoDataUrl = await getImageDataUrl(logoUrl).catch(() => null)

      const addHeader = (first = false) => {
        // Header: logo + title + divider
        if (logoDataUrl) {
          try {
            const imgH = 12
            const imgW = 12
            pdf.addImage(logoDataUrl, 'PNG', pageWidth - margin - imgW, 8, imgW, imgH)
          } catch {}
        }
        pdf.setFontSize(12)
        pdf.setFont(undefined, 'bold')
        pdf.text('BIMxPlan Go – BIM Execution Plan', margin, 12)
        pdf.setFont(undefined, 'normal')
        const title = exportData.project_overview?.project_name ? `Project: ${exportData.project_overview.project_name}` : ''
        if (title) pdf.text(title, margin, 18)
        pdf.setDrawColor(220)
        pdf.line(margin, 22, pageWidth - margin, 22)
        y = 28
      }
      const addFooterAllPages = (totalPages: number) => {
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i)
          pdf.setFontSize(9)
          pdf.setTextColor(100)
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
          const footerLeft = `${exportStartedAt.toLocaleString()}${projectId ? ` • Project ${projectId}` : ''}`
          pdf.text(footerLeft, margin, pageHeight - 8)
          pdf.setTextColor(0)
        }
      }
      const ensureSpace = (needed = 10) => {
        if (y + needed > pageHeight - margin) {
          pdf.addPage()
          addHeader()
        }
      }
      const addSection = (title: string) => {
        ensureSpace(12)
        pdf.setFontSize(14)
        pdf.setFont(undefined, 'bold')
        pdf.text(title, margin, y)
        y += 6
        pdf.setFont(undefined, 'normal')
      }
      const addField = (label: string, value?: string) => {
        if (!value) return
        ensureSpace(lineHeight + 2)
        pdf.setFontSize(11)
        const text = `${label}: ${value}`
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin)
        lines.forEach((ln: string) => {
          ensureSpace(lineHeight)
          pdf.text(ln, margin, y)
          y += lineHeight
        })
      }
      const addBullet = (text: string) => {
        if (!text) return
        ensureSpace(lineHeight)
        pdf.text(`• ${text}`, margin, y)
        y += lineHeight
      }

      // First page header
      addHeader(true)

      // Project Overview
      if (exportData.project_overview) {
        addSection('Project Overview')
        const po = exportData.project_overview
        addField('Location', po.location)
        addField('Client', po.client_name)
        addField('Project Type', po.project_type)
        if (po.key_milestones?.length) {
          ensureSpace()
          pdf.setFont(undefined, 'bold')
          pdf.text('Key Milestones', margin, y)
          y += 5
          pdf.setFont(undefined, 'normal')
          po.key_milestones.forEach(m => {
            const parts = [m.name, m.date].filter(Boolean).join(' – ')
            addBullet(`${parts}${m.description ? `: ${m.description}` : ''}`)
          })
        }
      }

      // Team & Responsibilities
      if (exportData.team_responsibilities?.firms?.length) {
        addSection('Team & Responsibilities')
        exportData.team_responsibilities.firms.forEach(f => {
          if (!f.name) return
          ensureSpace()
          pdf.setFont(undefined, 'bold')
          pdf.text(f.name, margin, y)
          y += 5
          pdf.setFont(undefined, 'normal')
          addField('Discipline', f.discipline)
          addField('BIM Lead', f.bim_lead)
          addField('Contact', f.contact_info)
        })
      }

      // Software Overview
      if (exportData.software_overview?.main_tools?.length) {
        addSection('Software Overview – Main Tools')
        exportData.software_overview.main_tools.forEach(t => {
          const name = t.name ? `${t.name}${t.version ? ` (${t.version})` : ''}` : ''
          const details = [t.discipline, t.usage].filter(Boolean).join(' – ')
          addBullet([name, details].filter(Boolean).join(' – '))
        })
      }

      // Modeling Scope
      if (exportData.modeling_scope) {
        addSection('Modeling Scope')
        const ms = exportData.modeling_scope
        addField('General LOD', ms.general_lod)
        addField('Units', ms.units)
        addField('Levels/Grids Strategy', ms.levels_grids_strategy)
        if (ms.discipline_lods?.length) {
          ensureSpace()
          pdf.setFont(undefined, 'bold')
          pdf.text('Discipline-Specific LODs', margin, y)
          y += 5
          pdf.setFont(undefined, 'normal')
          ms.discipline_lods.forEach(l => {
            const parts = [l.discipline, l.lod_level].filter(Boolean).join(': ')
            addBullet(`${parts}${l.description ? ` – ${l.description}` : ''}`)
          })
        }
      }

      // File Naming
      if (exportData.file_naming) {
        addSection('File Naming Convention')
        const fn = exportData.file_naming
        addField('Use Standard Conventions', typeof fn.use_conventions === 'boolean' ? (fn.use_conventions ? 'Yes' : 'No') : undefined)
        addField('Prefix Format', fn.prefix_format)
        addField('Discipline Codes', fn.discipline_codes)
        addField('Versioning Format', fn.versioning_format)
      }

      // Collaboration & CDE
      if (exportData.collaboration_cde) {
        addSection('Collaboration & Common Data Environment')
        const cde = exportData.collaboration_cde
        addField('Platform', cde.platform)
        addField('File Linking Method', cde.file_linking_method)
        addField('Sharing Frequency', cde.sharing_frequency)
        addField('Setup Responsibility', cde.setup_responsibility)
      }

      // Geolocation
      if (exportData.geolocation) {
        addSection('Geolocation & Coordinate System')
        const geo = exportData.geolocation
        addField('Georeferenced', typeof geo.is_georeferenced === 'boolean' ? (geo.is_georeferenced ? 'Yes' : 'No') : undefined)
        if (geo.is_georeferenced) {
          addField('Coordinate Setup', geo.coordinate_setup)
          addField('Origin Location', geo.origin_location)
          addField('Coordinate System', geo.coordinate_system)
        }
      }

      // Model Checking
      if (exportData.model_checking) {
        addSection('Model Checking & Coordination')
        const mc = exportData.model_checking
        if (mc.clash_detection_tools?.length) addField('Clash Detection Tools', mc.clash_detection_tools.join(', '))
        addField('Coordination Process', mc.coordination_process)
        addField('Meeting Frequency', mc.meeting_frequency)
      }

      // Outputs & Deliverables
      if (exportData.outputs_deliverables?.deliverables_by_phase?.length) {
        addSection('Outputs & Deliverables – By Phase')
        exportData.outputs_deliverables.deliverables_by_phase.forEach(p => {
          if (!p.phase) return
          ensureSpace()
          pdf.setFont(undefined, 'bold')
          pdf.text(p.phase, margin, y)
          y += 5
          pdf.setFont(undefined, 'normal')
          if (p.deliverables?.length) addField('Deliverables', p.deliverables.join(', '))
          if (p.formats?.length) addField('Formats', p.formats.join(', '))
          addField('Responsibility', p.responsibility)
        })
      }

      // Footer on all pages and generate PDF blob
      addFooterAllPages(pdf.getNumberOfPages())
      const name = (cleanExportData.project_overview?.project_name || 'Project').replace(/[^a-z0-9-_]+/gi, '_')
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const HH = String(d.getHours()).padStart(2, '0')
      const MM = String(d.getMinutes()).padStart(2, '0')
      const fileName = `${name}_BEP_${yyyy}${mm}${dd}_${HH}${MM}.pdf`
      
      logAction('PDF_SAVING_FILE', { fileName, pages: pdf.getNumberOfPages() })
      
      // Generate and download PDF blob with proper MIME type
      try {
        const pdfBlob = pdf.output('blob') as Blob
        const url = URL.createObjectURL(pdfBlob)
        
        // Create download link
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 100)
        
        logAction('PDF_DOWNLOAD_SUCCESS', { fileName, blobSize: pdfBlob.size })
      } catch (blobError) {
        logAction('PDF_BLOB_ERROR', { error: blobError })
        // Fallback to direct save
        pdf.save(fileName)
      }

      // Enhanced versioning with error handling
      if (projectId) {
        try {
          const { data: userRes } = await supabase.auth.getUser()
          const userId = userRes?.user?.id
          
          if (userId) {
            logAction('PDF_CREATING_VERSION')
            
            const { data: latest, error: vErr } = await supabase
              .from('project_versions')
              .select('version_number')
              .eq('project_id', projectId)
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle()
              
            if (vErr) {
              logAction('PDF_VERSION_QUERY_ERROR', { error: vErr.message })
              throw vErr
            }
            
            const next = (latest?.version_number || 0) + 1
            const { error: insErr } = await supabase
              .from('project_versions')
              .insert({
                project_id: projectId,
                version_number: next,
                project_data: cleanExportData,
                created_by: userId,
                changelog: `PDF Export v${next} • ${fileName} • ${Object.keys(cleanExportData).length} sections`
              })
              
            if (insErr) {
              logAction('PDF_VERSION_INSERT_ERROR', { error: insErr.message })
              throw insErr
            }
            
            logAction('PDF_VERSION_CREATED', { version: next, fileName })
            toast({ 
              title: 'PDF Generated Successfully', 
              description: `Exported as ${fileName} and saved as version v${next}` 
            })
          } else {
            logAction('PDF_NO_USER_FOR_VERSION')
            toast({ 
              title: 'PDF Generated Successfully', 
              description: `Exported as ${fileName}` 
            })
          }
        } catch (versionError) {
          const versionErrorMsg = versionError instanceof Error ? versionError.message : 'Unknown versioning error'
          logAction('PDF_VERSION_FAILED', { error: versionErrorMsg })
          
          // PDF was generated successfully, just version logging failed
          toast({ 
            title: 'PDF Generated', 
            description: `Exported as ${fileName}. Version logging failed: ${versionErrorMsg}`,
            variant: 'default'
          })
        }
      } else {
        toast({ 
          title: 'PDF Generated Successfully', 
          description: `Exported as ${fileName}` 
        })
      }
      
      const duration = Date.now() - startTime
      logAction('PDF_EXPORT_SUCCESS', { fileName, duration, pages: pdf.getNumberOfPages() })
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logAction('PDF_EXPORT_FAILED', { error: errorMsg, duration })
      
      // Enhanced error messages for different failure modes
      const isTimeout = errorMsg.includes('timeout')
      const isPermission = errorMsg.includes('access') || errorMsg.includes('permission')
      const isValidation = errorMsg.includes('validation') || errorMsg.includes('required')
      
      let description = 'There was an error generating the PDF. Please try again.'
      if (isTimeout) {
        description = 'PDF export timed out. Try again or contact support for large projects.'
      } else if (isPermission) {
        description = 'Permission denied. Contact the project owner.'
      } else if (isValidation) {
        description = 'Please complete all required fields before exporting.'
      } else if (errorMsg.length < 100) {
        description = `Export failed: ${errorMsg}`
      }
      
      toast({ 
        title: 'PDF Export Failed', 
        description, 
        variant: 'destructive' 
      })
    } finally {
      setExporting(false)
    }
  }

  const handleCopyMarkdown = async () => {
    logAction('MARKDOWN_COPY_START')
    try {
      if (Object.keys(previewData).length === 0) {
        toast({ title: 'No data to copy', description: 'Please fill out the BEP form first', variant: 'destructive' })
        return
      }
      
      const markdown = generateMarkdown(previewData)
      await navigator.clipboard.writeText(markdown)
      
      logAction('MARKDOWN_COPY_SUCCESS', { length: markdown.length })
      toast({ title: 'Copied to clipboard', description: 'Markdown content copied successfully' })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logAction('MARKDOWN_COPY_ERROR', { error: errorMsg })
      toast({ title: 'Copy failed', description: `Could not copy to clipboard: ${errorMsg}`, variant: 'destructive' })
    }
  }

  const PreviewContent = () => (
    <div className="space-y-6">
      {/* Project Header */}
      {previewData.project_overview && (
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold mb-2">{previewData.project_overview.project_name || 'BIM Execution Plan'}</h1>
          <div className="flex justify-center items-center space-x-6 text-muted-foreground">
            {previewData.project_overview.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {previewData.project_overview.location}
              </div>
            )}
            {previewData.project_overview.client_name && (
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1" />
                {previewData.project_overview.client_name}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Project Overview */}
      {previewData.project_overview && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Project Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Project Type:</strong> {previewData.project_overview.project_type || 'N/A'}
            </div>
          </div>
          {previewData.project_overview.key_milestones?.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Key Milestones</h3>
              <div className="space-y-2">
                {previewData.project_overview.key_milestones.map((milestone, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">{milestone.name}</span>
                    <Badge variant="outline">{milestone.date}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Team & Responsibilities */}
      {previewData.team_responsibilities?.firms?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team & Responsibilities
          </h2>
          <div className="grid gap-4">
            {previewData.team_responsibilities.firms.map((firm, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{firm.name}</h3>
                    <Badge>{firm.discipline}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>BIM Lead:</strong> {firm.bim_lead}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Contact:</strong> {firm.contact_info}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Software Overview */}
      {previewData.software_overview?.main_tools?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Software Overview
          </h2>
          <div className="grid gap-2">
            {previewData.software_overview.main_tools.map((tool, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{tool.name}{tool.version && ` (${tool.version})`}</h3>
                    {tool.discipline && <Badge variant="outline">{tool.discipline}</Badge>}
                  </div>
                  {tool.usage && <p className="text-sm text-muted-foreground">{tool.usage}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Modeling Scope */}
      {previewData.modeling_scope && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Modeling Scope
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {previewData.modeling_scope.general_lod && (
              <div><strong>General LOD:</strong> {previewData.modeling_scope.general_lod}</div>
            )}
            {previewData.modeling_scope.units && (
              <div><strong>Units:</strong> {previewData.modeling_scope.units}</div>
            )}
          </div>
          {previewData.modeling_scope.levels_grids_strategy && (
            <div className="mb-4">
              <strong>Levels/Grids Strategy:</strong> {previewData.modeling_scope.levels_grids_strategy}
            </div>
          )}
          {previewData.modeling_scope.discipline_lods?.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Discipline-Specific LODs</h3>
              <div className="space-y-2">
                {previewData.modeling_scope.discipline_lods.map((lod, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span><strong>{lod.discipline}:</strong> {lod.lod_level}</span>
                    {lod.description && <span className="text-sm text-muted-foreground">{lod.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* File Naming Convention */}
      {previewData.file_naming && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileArchive className="h-5 w-5 mr-2" />
            File Naming Convention
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typeof previewData.file_naming.use_conventions === 'boolean' && (
              <div><strong>Use Standard Conventions:</strong> {previewData.file_naming.use_conventions ? 'Yes' : 'No'}</div>
            )}
            {previewData.file_naming.prefix_format && (
              <div><strong>Prefix Format:</strong> {previewData.file_naming.prefix_format}</div>
            )}
            {previewData.file_naming.discipline_codes && (
              <div><strong>Discipline Codes:</strong> {previewData.file_naming.discipline_codes}</div>
            )}
            {previewData.file_naming.versioning_format && (
              <div><strong>Versioning Format:</strong> {previewData.file_naming.versioning_format}</div>
            )}
          </div>
        </section>
      )}

      {/* Collaboration & CDE */}
      {previewData.collaboration_cde && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Collaboration & Common Data Environment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previewData.collaboration_cde.platform && (
              <div><strong>Platform:</strong> {previewData.collaboration_cde.platform}</div>
            )}
            {previewData.collaboration_cde.file_linking_method && (
              <div><strong>File Linking Method:</strong> {previewData.collaboration_cde.file_linking_method}</div>
            )}
            {previewData.collaboration_cde.sharing_frequency && (
              <div><strong>Sharing Frequency:</strong> {previewData.collaboration_cde.sharing_frequency}</div>
            )}
            {previewData.collaboration_cde.setup_responsibility && (
              <div><strong>Setup Responsibility:</strong> {previewData.collaboration_cde.setup_responsibility}</div>
            )}
          </div>
        </section>
      )}

      {/* Geolocation */}
      {previewData.geolocation && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Geolocation & Coordinate System
          </h2>
          <div className="space-y-2">
            {typeof previewData.geolocation.is_georeferenced === 'boolean' && (
              <div><strong>Georeferenced:</strong> {previewData.geolocation.is_georeferenced ? 'Yes' : 'No'}</div>
            )}
            {previewData.geolocation.is_georeferenced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {previewData.geolocation.coordinate_setup && (
                  <div><strong>Coordinate Setup:</strong> {previewData.geolocation.coordinate_setup}</div>
                )}
                {previewData.geolocation.origin_location && (
                  <div><strong>Origin Location:</strong> {previewData.geolocation.origin_location}</div>
                )}
                {previewData.geolocation.coordinate_system && (
                  <div><strong>Coordinate System:</strong> {previewData.geolocation.coordinate_system}</div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Model Checking & Coordination */}
      {previewData.model_checking && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Model Checking & Coordination
          </h2>
          <div className="space-y-2">
            {previewData.model_checking.clash_detection_tools?.length > 0 && (
              <div><strong>Clash Detection Tools:</strong> {previewData.model_checking.clash_detection_tools.join(', ')}</div>
            )}
            {previewData.model_checking.coordination_process && (
              <div><strong>Coordination Process:</strong> {previewData.model_checking.coordination_process}</div>
            )}
            {previewData.model_checking.meeting_frequency && (
              <div><strong>Meeting Frequency:</strong> {previewData.model_checking.meeting_frequency}</div>
            )}
          </div>
        </section>
      )}

      {/* Outputs & Deliverables */}
      {previewData.outputs_deliverables?.deliverables_by_phase?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Outputs & Deliverables
          </h2>
          <div className="space-y-4">
            {previewData.outputs_deliverables.deliverables_by_phase.map((phase, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{phase.phase}</CardTitle>
                </CardHeader>
                <CardContent>
                  {phase.deliverables?.length > 0 && (
                    <div className="mb-2">
                      <strong>Deliverables:</strong> {phase.deliverables.join(', ')}
                    </div>
                  )}
                  {phase.formats?.length > 0 && (
                    <div className="mb-2">
                      <strong>Formats:</strong> {phase.formats.join(', ')}
                    </div>
                  )}
                  {phase.responsibility && (
                    <div><strong>Responsibility:</strong> {phase.responsibility}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
      
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        Generated by BIMxPlan Go on {new Date().toLocaleDateString()}
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span>Preview & Export</span>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto relative z-10">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto min-h-[44px] touch-manipulation" 
              onClick={() => refreshPreview()} 
              disabled={isRefreshing || (!hasAccess && !!projectId)}
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Preview</span>
            </Button>
            <Dialog open={showPreview} onOpenChange={(v) => { setShowPreview(v); if (v) refreshPreview() }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto min-h-[44px] touch-manipulation" 
                  disabled={!hasAccess && !!projectId}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">Preview Document</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[85vh] mx-4">
                <DialogHeader>
                  <DialogTitle>BEP Preview</DialogTitle>
                  <DialogDescription>
                    Preview your BIM Execution Plan before exporting
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[70vh] pr-4">
                  <PreviewContent />
                </ScrollArea>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto min-h-[44px] touch-manipulation" 
              onClick={handleCopyMarkdown} 
              disabled={!hasAccess && !!projectId}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Copy Markdown</span>
              <span className="sm:hidden">Copy MD</span>
            </Button>
            
            <Button 
              size="sm" 
              className="w-full sm:w-auto min-h-[44px] touch-manipulation" 
              onClick={generatePDF} 
              disabled={issues.length > 0 || exporting || (!hasAccess && !!projectId)}
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export PDF'}</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {!hasAccess && projectId && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to view or export this project.
            </AlertDescription>
          </Alert>
        )}
        {issues.length > 0 && hasAccess && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Missing required fields</AlertTitle>
            <AlertDescription>
              {issues.slice(0, 5).map((i, idx) => (
                <div key={idx}>• {i.section}: {i.message}</div>
              ))}
              {issues.length > 5 && <div>…and {issues.length - 5} more</div>}
            </AlertDescription>
          </Alert>
        )}
        <div className="text-center py-8">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Your BEP is Ready</h3>
          <p className="text-muted-foreground mb-6">
            Refresh the preview, copy Markdown, or export a PDF. PDF export is disabled until required fields are completed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 max-w-2xl mx-auto pb-4 relative z-10">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none sm:min-w-[140px] min-h-[44px] touch-manipulation" 
              onClick={() => refreshPreview()} 
              disabled={isRefreshing || (!hasAccess && !!projectId)}
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Preview
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none sm:min-w-[140px] min-h-[44px] touch-manipulation" 
              onClick={async () => { await refreshPreview(); setShowPreview(true) }} 
              disabled={!hasAccess && !!projectId}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Document
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none sm:min-w-[140px] min-h-[44px] touch-manipulation" 
              onClick={handleCopyMarkdown} 
              disabled={!hasAccess && !!projectId}
            >
              <FileText className="h-4 w-4 mr-2" />
              Copy Markdown
            </Button>
            <Button 
              className="flex-1 sm:flex-none sm:min-w-[140px] min-h-[44px] touch-manipulation" 
              onClick={generatePDF} 
              disabled={issues.length > 0 || exporting || (!hasAccess && !!projectId)}
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}