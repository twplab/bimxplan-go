import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Eye, Calendar, Users, Building, MapPin } from "lucide-react"
import { ProjectData } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import jsPDF from 'jspdf'

interface BEPPreviewProps {
  data?: Partial<ProjectData>
  onUpdate?: (data: any) => void
  projectData?: Partial<ProjectData>
}

export function EnhancedBEPPreview({ data, projectData }: BEPPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()
  const bepData = data || projectData || {}

  const generateMarkdown = (data: Partial<ProjectData>): string => {
    let markdown = `# BIM Execution Plan\n\n`
    
    // Project Overview
    if (data.project_overview) {
      markdown += `## Project Overview\n\n`
      markdown += `**Project Name:** ${data.project_overview.project_name || 'N/A'}\n`
      markdown += `**Location:** ${data.project_overview.location || 'N/A'}\n`
      markdown += `**Client:** ${data.project_overview.client_name || 'N/A'}\n`
      markdown += `**Project Type:** ${data.project_overview.project_type || 'N/A'}\n\n`
      
      if (data.project_overview.key_milestones?.length) {
        markdown += `### Key Milestones\n\n`
        data.project_overview.key_milestones.forEach(milestone => {
          markdown += `- **${milestone.name}** (${milestone.date}): ${milestone.description}\n`
        })
        markdown += `\n`
      }
    }

    // Team & Responsibilities
    if (data.team_responsibilities?.firms?.length) {
      markdown += `## Team & Responsibilities\n\n`
      data.team_responsibilities.firms.forEach(firm => {
        markdown += `### ${firm.name}\n`
        markdown += `- **Discipline:** ${firm.discipline}\n`
        markdown += `- **BIM Lead:** ${firm.bim_lead}\n`
        markdown += `- **Contact:** ${firm.contact_info}\n\n`
      })
    }

    // Software Overview
    if (data.software_overview) {
      markdown += `## Software Overview\n\n`
      if (data.software_overview.main_tools?.length) {
        markdown += `### Main Tools\n\n`
        data.software_overview.main_tools.forEach(tool => {
          markdown += `- **${tool.name}** (${tool.version}) - ${tool.discipline}: ${tool.usage}\n`
        })
        markdown += `\n`
      }
    }

    // Modeling Scope
    if (data.modeling_scope) {
      markdown += `## Modeling Scope\n\n`
      markdown += `**General LOD:** ${data.modeling_scope.general_lod || 'N/A'}\n`
      markdown += `**Units:** ${data.modeling_scope.units || 'N/A'}\n`
      markdown += `**Levels/Grids Strategy:** ${data.modeling_scope.levels_grids_strategy || 'N/A'}\n\n`
      
      if (data.modeling_scope.discipline_lods?.length) {
        markdown += `### Discipline-Specific LODs\n\n`
        data.modeling_scope.discipline_lods.forEach(lod => {
          markdown += `- **${lod.discipline}:** ${lod.lod_level} - ${lod.description}\n`
        })
        markdown += `\n`
      }
    }

    // File Naming
    if (data.file_naming) {
      markdown += `## File Naming Convention\n\n`
      markdown += `**Use Standard Conventions:** ${data.file_naming.use_conventions ? 'Yes' : 'No'}\n`
      markdown += `**Prefix Format:** ${data.file_naming.prefix_format || 'N/A'}\n`
      markdown += `**Discipline Codes:** ${data.file_naming.discipline_codes || 'N/A'}\n`
      markdown += `**Versioning Format:** ${data.file_naming.versioning_format || 'N/A'}\n\n`
    }

    // Collaboration & CDE
    if (data.collaboration_cde) {
      markdown += `## Collaboration & Common Data Environment\n\n`
      markdown += `**Platform:** ${data.collaboration_cde.platform || 'N/A'}\n`
      markdown += `**File Linking Method:** ${data.collaboration_cde.file_linking_method || 'N/A'}\n`
      markdown += `**Sharing Frequency:** ${data.collaboration_cde.sharing_frequency || 'N/A'}\n`
      markdown += `**Setup Responsibility:** ${data.collaboration_cde.setup_responsibility || 'N/A'}\n\n`
    }

    // Geolocation
    if (data.geolocation) {
      markdown += `## Geolocation & Coordinate System\n\n`
      markdown += `**Georeferenced:** ${data.geolocation.is_georeferenced ? 'Yes' : 'No'}\n`
      if (data.geolocation.is_georeferenced) {
        markdown += `**Coordinate Setup:** ${data.geolocation.coordinate_setup || 'N/A'}\n`
        markdown += `**Origin Location:** ${data.geolocation.origin_location || 'N/A'}\n`
        markdown += `**Coordinate System:** ${data.geolocation.coordinate_system || 'N/A'}\n`
      }
      markdown += `\n`
    }

    // Model Checking
    if (data.model_checking) {
      markdown += `## Model Checking & Coordination\n\n`
      markdown += `**Clash Detection Tools:** ${data.model_checking.clash_detection_tools?.join(', ') || 'N/A'}\n`
      markdown += `**Coordination Process:** ${data.model_checking.coordination_process || 'N/A'}\n`
      markdown += `**Meeting Frequency:** ${data.model_checking.meeting_frequency || 'N/A'}\n\n`
    }

    // Outputs & Deliverables
    if (data.outputs_deliverables) {
      markdown += `## Outputs & Deliverables\n\n`
      if (data.outputs_deliverables.deliverables_by_phase?.length) {
        markdown += `### Deliverables by Phase\n\n`
        data.outputs_deliverables.deliverables_by_phase.forEach(phase => {
          markdown += `#### ${phase.phase}\n`
          markdown += `- **Deliverables:** ${phase.deliverables?.join(', ') || 'N/A'}\n`
          markdown += `- **Formats:** ${phase.formats?.join(', ') || 'N/A'}\n`
          markdown += `- **Responsibility:** ${phase.responsibility || 'N/A'}\n\n`
        })
      }
    }

    markdown += `---\n\n`
    markdown += `*Generated by BIMxPlan Go on ${new Date().toLocaleDateString()}*\n`

    return markdown
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
        <CardTitle className="flex items-center justify-between">
          Preview & Export
          <div className="flex space-x-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
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
            
            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
              <FileText className="h-4 w-4 mr-2" />
              Markdown
            </Button>
            
            <Button size="sm" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
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
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Document
            </Button>
            <Button onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}