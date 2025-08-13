import React, { useMemo, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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
  const { toast } = useToast()
  const bepData = useMemo(() => data || projectData || {}, [data, projectData])

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

  const issues = useMemo(() => validateData(bepData), [bepData])

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

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 20
      let yPosition = margin

      // Helper function to add text with line breaks
      const addText = (text: string, fontSize = 12, isBold = false) => {
        pdf.setFontSize(fontSize)
        if (isBold) {
          pdf.setFont(undefined, 'bold')
        } else {
          pdf.setFont(undefined, 'normal')
        }
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin)
        lines.forEach((line: string) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(line, margin, yPosition)
          yPosition += fontSize * 0.4
        })
        yPosition += 5
      }

      // Title
      addText('BIM Execution Plan', 20, true)
      yPosition += 10

      // Project Overview
      if (bepData.project_overview) {
        addText('Project Overview', 16, true)
        addText(`Project: ${bepData.project_overview.project_name || 'N/A'}`)
        addText(`Location: ${bepData.project_overview.location || 'N/A'}`)
        addText(`Client: ${bepData.project_overview.client_name || 'N/A'}`)
        addText(`Type: ${bepData.project_overview.project_type || 'N/A'}`)
        yPosition += 10
      }

      // Add other sections similarly...
      if (bepData.team_responsibilities?.firms?.length) {
        addText('Team & Responsibilities', 16, true)
        bepData.team_responsibilities.firms.forEach(firm => {
          addText(`${firm.name} (${firm.discipline})`, 12, true)
          addText(`BIM Lead: ${firm.bim_lead}`)
          addText(`Contact: ${firm.contact_info}`)
        })
        yPosition += 10
      }

      // Footer
      addText(`Generated on ${new Date().toLocaleDateString()}`, 10)

      pdf.save(`BEP_${bepData.project_overview?.project_name || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "PDF Generated",
        description: "Your BEP has been exported as PDF successfully.",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportMarkdown = () => {
    const markdown = generateMarkdown(bepData)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `BEP_${bepData.project_overview?.project_name || 'Project'}_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Markdown Exported",
      description: "Your BEP has been exported as Markdown successfully.",
    })
  }

  const PreviewContent = () => (
    <div className="space-y-6">
      {/* Project Header */}
      {bepData.project_overview && (
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold mb-2">{bepData.project_overview.project_name || 'BIM Execution Plan'}</h1>
          <div className="flex justify-center items-center space-x-6 text-muted-foreground">
            {bepData.project_overview.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {bepData.project_overview.location}
              </div>
            )}
            {bepData.project_overview.client_name && (
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1" />
                {bepData.project_overview.client_name}
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
      {bepData.project_overview && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Project Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Project Type:</strong> {bepData.project_overview.project_type || 'N/A'}
            </div>
          </div>
          {bepData.project_overview.key_milestones?.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Key Milestones</h3>
              <div className="space-y-2">
                {bepData.project_overview.key_milestones.map((milestone, index) => (
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
      {bepData.team_responsibilities?.firms?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team & Responsibilities
          </h2>
          <div className="grid gap-4">
            {bepData.team_responsibilities.firms.map((firm, index) => (
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
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
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
            
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleExportMarkdown}>
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Markdown</span>
              <span className="sm:hidden">MD</span>
            </Button>
            
            <Button size="sm" className="w-full sm:w-auto" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-8">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Your BEP is Ready</h3>
          <p className="text-muted-foreground mb-6">
            Review your BIM Execution Plan and export it in your preferred format.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4 sm:space-y-0">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Document
            </Button>
            <Button className="w-full sm:w-auto" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}