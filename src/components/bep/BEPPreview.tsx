import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProjectData } from "@/lib/supabase"
import { Download, FileText, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BEPPreviewProps {
  projectData: Partial<ProjectData>
  onUpdate?: (data: Record<string, unknown>) => void
}

export function BEPPreview({ projectData }: BEPPreviewProps) {
  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export functionality will be implemented with jsPDF library.",
    })
  }

  const handleExportMarkdown = () => {
    const markdown = generateMarkdown(projectData)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bim-execution-plan.md'
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Markdown Exported",
      description: "BIM Execution Plan exported as Markdown file.",
    })
  }

  const generateMarkdown = (data: Partial<ProjectData>): string => {
    return `# BIM Execution Plan

## Project Overview
- **Project Name:** ${data.project_overview?.project_name || 'Not specified'}
- **Location:** ${data.project_overview?.location || 'Not specified'}
- **Client:** ${data.project_overview?.client_name || 'Not specified'}
- **Project Type:** ${data.project_overview?.project_type || 'Not specified'}

### Key Milestones
${data.project_overview?.key_milestones?.map(m => `- **${m.name}:** ${m.date} - ${m.description}`).join('\n') || 'No milestones defined'}

## Team & Responsibilities
${data.team_responsibilities?.firms?.map(f => `
### ${f.name}
- **Discipline:** ${f.discipline}
- **BIM Lead:** ${f.bim_lead}
- **Contact:** ${f.contact_info}
`).join('\n') || 'No team information provided'}

## Software Overview
### Main BIM Tools
${data.software_overview?.main_tools?.map(t => `- **${t.name}** ${t.version} (${t.discipline}) - ${t.usage}`).join('\n') || 'No software specified'}

### Team-Specific Tools
${data.software_overview?.team_specific_tools?.map(t => `- **${t.name}** ${t.version} (${t.discipline}) - ${t.usage}`).join('\n') || 'No additional tools specified'}

## Modeling Scope
- **General LOD:** ${data.modeling_scope?.general_lod || 'Not specified'}
- **Units:** ${data.modeling_scope?.units || 'Not specified'}
- **Levels & Grids Strategy:** ${data.modeling_scope?.levels_grids_strategy || 'Not specified'}

### Discipline-Specific LODs
${data.modeling_scope?.discipline_lods?.map(d => `- **${d.discipline}:** ${d.lod_level} - ${d.description}`).join('\n') || 'No discipline LODs specified'}

### Exceptions
${data.modeling_scope?.exceptions?.map(e => `- ${e}`).join('\n') || 'No exceptions specified'}

## File Naming Conventions
${data.file_naming?.use_conventions ? `
- **Format:** ${data.file_naming.prefix_format}
- **Discipline Codes:** ${data.file_naming.discipline_codes}
- **Versioning:** ${data.file_naming.versioning_format}

### Examples
${data.file_naming.examples?.map(e => `- ${e}`).join('\n') || 'No examples provided'}
` : 'File naming conventions are not being used for this project.'}

## Collaboration & CDE
- **Platform:** ${data.collaboration_cde?.platform || 'Not specified'}
- **File Linking:** ${data.collaboration_cde?.file_linking_method || 'Not specified'}
- **Sharing Frequency:** ${data.collaboration_cde?.sharing_frequency || 'Not specified'}
- **Setup Responsibility:** ${data.collaboration_cde?.setup_responsibility || 'Not specified'}

### Access Controls
${data.collaboration_cde?.access_controls || 'No access controls specified'}

## Geolocation & Coordinates
${data.geolocation?.is_georeferenced ? `
- **Coordinate System:** ${data.geolocation.coordinate_system}
- **Setup Method:** ${data.geolocation.coordinate_setup}
- **Origin Location:** ${data.geolocation.origin_location}
` : 'Project is not georeferenced'}

## Model Checking & Coordination
- **Clash Detection Tools:** ${data.model_checking?.clash_detection_tools?.join(', ') || 'Not specified'}
- **Meeting Frequency:** ${data.model_checking?.meeting_frequency || 'Not specified'}

### Coordination Process
${data.model_checking?.coordination_process || 'No coordination process specified'}

### Responsibility Matrix
${data.model_checking?.responsibility_matrix || 'No responsibility matrix specified'}

## Outputs & Deliverables
### Standard Formats
${data.outputs_deliverables?.formats_standards?.join(', ') || 'No formats specified'}

### Deliverables by Phase
${data.outputs_deliverables?.deliverables_by_phase?.map(p => `
#### ${p.phase}
- **Deliverables:** ${p.deliverables.join(', ')}
- **Formats:** ${p.formats.join(', ')}
- **Responsibility:** ${p.responsibility}
`).join('\n') || 'No phase deliverables specified'}

### Milestone Schedule
${data.outputs_deliverables?.milestone_schedule?.map(m => `- **${m.milestone}** (${m.deadline}): ${m.deliverables.join(', ')}`).join('\n') || 'No milestone schedule specified'}

---
*Generated by BIMxPlan Go - Lean BIM Execution Plan Generator*
`
  }

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">BIM Execution Plan Preview</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExportMarkdown}>
                <FileText className="h-4 w-4 mr-2" />
                Export Markdown
              </Button>
              <Button onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review your BIM execution plan below. You can export it as a PDF for client presentation or as Markdown for further editing.
          </p>
        </CardContent>
      </Card>

      {/* Preview Content */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h1 className="text-3xl font-bold text-foreground mb-6">BIM Execution Plan</h1>
              
              {/* Project Overview */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Project Overview</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <strong>Project Name:</strong> {projectData.project_overview?.project_name || 'Not specified'}
                  </div>
                  <div>
                    <strong>Location:</strong> {projectData.project_overview?.location || 'Not specified'}
                  </div>
                  <div>
                    <strong>Client:</strong> {projectData.project_overview?.client_name || 'Not specified'}
                  </div>
                  <div>
                    <strong>Project Type:</strong> {projectData.project_overview?.project_type || 'Not specified'}
                  </div>
                </div>
                
                {projectData.project_overview?.key_milestones && projectData.project_overview.key_milestones.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Key Milestones</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {projectData.project_overview.key_milestones.map((milestone, index) => (
                        <li key={index}>
                          <strong>{milestone.name}:</strong> {milestone.date} - {milestone.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Team & Responsibilities */}
              {projectData.team_responsibilities?.firms && projectData.team_responsibilities.firms.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Team & Responsibilities</h2>
                  {projectData.team_responsibilities.firms.map((firm, index) => (
                    <div key={index} className="mb-4 p-4 bg-muted rounded-lg">
                      <h3 className="text-lg font-medium text-foreground">{firm.name}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div><strong>Discipline:</strong> {firm.discipline}</div>
                        <div><strong>BIM Lead:</strong> {firm.bim_lead}</div>
                        <div><strong>Contact:</strong> {firm.contact_info}</div>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Software Overview */}
              {(projectData.software_overview?.main_tools || projectData.software_overview?.team_specific_tools) && (
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Software Overview</h2>
                  
                  {projectData.software_overview.main_tools && projectData.software_overview.main_tools.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-foreground mb-2">Main BIM Tools</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {projectData.software_overview.main_tools.map((tool, index) => (
                          <li key={index}>
                            <strong>{tool.name}</strong> {tool.version} ({tool.discipline}) - {tool.usage}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {projectData.software_overview.team_specific_tools && projectData.software_overview.team_specific_tools.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Team-Specific Tools</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {projectData.software_overview.team_specific_tools.map((tool, index) => (
                          <li key={index}>
                            <strong>{tool.name}</strong> {tool.version} ({tool.discipline}) - {tool.usage}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* Continue with other sections... */}
              <div className="text-center text-muted-foreground mt-8 pt-8 border-t">
                <p className="text-sm">Generated by BIMxPlan Go - Lean BIM Execution Plan Generator</p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}