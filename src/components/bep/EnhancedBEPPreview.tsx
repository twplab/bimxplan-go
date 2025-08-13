import React, { useEffect, useMemo, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, FileText, Eye, Calendar, Users, Building, MapPin, RotateCw } from "lucide-react"
import { ProjectData } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import jsPDF from 'jspdf'
import { supabase } from "@/integrations/supabase/client"
import logoUrl from "@/assets/bimxplan-logo.png"

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
  const baseData = useMemo(() => data || projectData || {}, [data, projectData])
  const [previewData, setPreviewData] = useState<Partial<ProjectData>>(baseData)
  
  useEffect(() => {
    setPreviewData(baseData)
  }, [baseData])

  const { toast } = useToast()

  const validateData = (d: Partial<ProjectData>): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
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
    return issues
  }

  const issues = useMemo(() => validateData(previewData), [previewData])

  const generateMarkdown = (data: Partial<ProjectData>): string => {
    let md = `# BIM Execution Plan\n\n`

    if (data.project_overview) {
      md += `## Project Overview\n\n`
      const po = data.project_overview
      if (po.project_name) md += `**Project Name:** ${po.project_name}\n`
      if (po.location) md += `**Location:** ${po.location}\n`
      if (po.client_name) md += `**Client:** ${po.client_name}\n`
      if (po.project_type) md += `**Project Type:** ${po.project_type}\n\n`
      if (po.key_milestones?.length) {
        md += `### Key Milestones\n\n`
        po.key_milestones.forEach(m => {
          const parts = [m.name, m.date].filter(Boolean).join(' - ')
          if (parts) md += `- ${parts}${m.description ? `: ${m.description}` : ''}\n`
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

  const refreshPreview = async () => {
    setIsRefreshing(true)
    try {
      if (onSave) await onSave()
      let latest = baseData
      if (projectId) {
        const { data, error } = await supabase
          .from('projects')
          .select('project_data,id,name')
          .eq('id', projectId)
          .maybeSingle()
        if (error) throw error
        latest = (data?.project_data as Partial<ProjectData>) || latest
      }
      setPreviewData(latest)
      toast({ title: 'Preview updated', description: 'Preview reflects latest saved data.' })
    } catch (error) {
      console.error('Preview refresh error', { projectId, error })
      toast({ title: 'Preview refresh failed', description: 'Could not refresh preview. Try again.', variant: 'destructive' })
    } finally {
      setIsRefreshing(false)
    }
  }

  const generatePDF = async () => {
    setExporting(true)
    const exportStartedAt = new Date()
    try {
      if (onSave) await onSave()

      // Fetch freshest data from DB to avoid stale content
      let exportData: Partial<ProjectData> = previewData
      if (projectId) {
        const { data, error } = await supabase
          .from('projects')
          .select('project_data,id,name')
          .eq('id', projectId)
          .maybeSingle()
        if (error) throw error
        exportData = (data?.project_data as Partial<ProjectData>) || exportData
      }

      const currentIssues = validateData(exportData)
      if (currentIssues.length) {
        const list = currentIssues.slice(0, 5).map(i => `${i.section}: ${i.message}`).join(' • ')
        toast({ title: 'Missing required fields', description: list, variant: 'destructive' })
        return
      }

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
      const logoDataUrl = await getImageDataUrl(logoUrl)

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

      // Footer on all pages and save
      addFooterAllPages(pdf.getNumberOfPages())
      const name = (exportData.project_overview?.project_name || 'Project').replace(/[^a-z0-9-_]+/gi, '_')
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const HH = String(d.getHours()).padStart(2, '0')
      const MM = String(d.getMinutes()).padStart(2, '0')
      const fileName = `${name}_BEP_${yyyy}${mm}${dd}_${HH}${MM}.pdf`
      pdf.save(fileName)

      // Versioning hook
      if (projectId) {
        const { data: userRes } = await supabase.auth.getUser()
        const userId = userRes?.user?.id
        if (userId) {
          const { data: latest, error: vErr } = await supabase
            .from('project_versions')
            .select('version_number')
            .eq('project_id', projectId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (vErr) throw vErr
          const next = (latest?.version_number || 0) + 1
          const { error: insErr } = await supabase
            .from('project_versions')
            .insert({
              project_id: projectId,
              version_number: next,
              project_data: exportData,
              created_by: userId,
              changelog: `Exported PDF v${next} • ${fileName}`
            })
          if (insErr) throw insErr
          toast({ title: 'PDF Generated', description: `Exported and recorded as version v${next}.` })
        } else {
          toast({ title: 'PDF Generated', description: 'Exported successfully.' })
        }
      } else {
        toast({ title: 'PDF Generated', description: 'Exported successfully.' })
      }
    } catch (error) {
      console.error('BEP Export Error', { projectId, error })
      toast({ title: 'Export Failed', description: 'There was an error generating the PDF. Please try again.', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleCopyMarkdown = async () => {
    try {
      const markdown = generateMarkdown(previewData)
      await navigator.clipboard.writeText(markdown)
      toast({ title: 'Markdown copied', description: 'BEP content copied to clipboard.' })
    } catch (e) {
      console.error('Copy markdown failed', e)
      toast({ title: 'Copy failed', description: 'Could not copy markdown. Try export PDF instead.', variant: 'destructive' })
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

      {/* Add more sections here for complete preview */}
      
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={refreshPreview} disabled={isRefreshing}>
              <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Preview</span>
            </Button>
            <Dialog open={showPreview} onOpenChange={(v) => { setShowPreview(v); if (v) refreshPreview() }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">Preview Document</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>BEP Preview</DialogTitle>
                  <DialogDescription>
                    Preview your BIM Execution Plan before exporting
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <PreviewContent />
                </ScrollArea>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleCopyMarkdown}>
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Copy Markdown</span>
              <span className="sm:hidden">Copy MD</span>
            </Button>
            
            <Button size="sm" className="w-full sm:w-auto" onClick={generatePDF} disabled={issues.length > 0 || exporting}>
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export PDF'}</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {issues.length > 0 && (
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
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4 sm:space-y-0">
            <Button variant="outline" className="w-full sm:w-auto" onClick={refreshPreview} disabled={isRefreshing}>
              <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Preview
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={async () => { await refreshPreview(); setShowPreview(true) }}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Document
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleCopyMarkdown}>
              <FileText className="h-4 w-4 mr-2" />
              Copy Markdown
            </Button>
            <Button className="w-full sm:w-auto" onClick={generatePDF} disabled={issues.length > 0 || exporting}>
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}