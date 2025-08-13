import jsPDF from 'jspdf'
import { PdfModel } from './BEPPdfMapper'
import { supabase } from "@/integrations/supabase/client"

/**
 * Helper function to generate PDF filename
 */
export function generatePdfFilename(projectName: string): string {
  const safeName = projectName.replace(/[^a-zA-Z0-9]/g, '_') || 'BEP_Project'
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:\-T]/g, '_')
  return `${safeName}_BEP_Summary_${timestamp}.pdf`
}

/**
 * Create version entry in database
 */
export async function createVersionEntry(
  projectId: string, 
  exportData: any, 
  filename: string
): Promise<void> {
  try {
    console.log('[BEP-PDF-RENDERER]', {
      timestamp: new Date().toISOString(),
      action: 'VERSION_CREATE_START',
      projectId,
      filename
    })

    const { error: versionError } = await supabase
      .from('project_versions')
      .insert({
        project_id: projectId,
        version_number: Math.floor(Date.now() / 1000),
        project_data: exportData,
        changelog: `BEP PDF Export: ${filename}`,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
    
    if (versionError) {
      console.log('[BEP-PDF-RENDERER]', {
        timestamp: new Date().toISOString(),
        action: 'VERSION_CREATE_ERROR',
        projectId,
        error: versionError.message
      })
    } else {
      console.log('[BEP-PDF-RENDERER]', {
        timestamp: new Date().toISOString(),
        action: 'VERSION_CREATE_SUCCESS',
        projectId,
        filename
      })
    }
  } catch (error) {
    console.log('[BEP-PDF-RENDERER]', {
      timestamp: new Date().toISOString(),
      action: 'VERSION_CREATE_ERROR',
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Main PDF rendering function
 */
export async function renderPdfFromModel(model: PdfModel, projectId: string): Promise<jsPDF> {
  console.log('[BEP-PDF-RENDERER]', {
    timestamp: new Date().toISOString(),
    action: 'RENDER_START',
    projectId,
    sectionsToRender: Object.keys(model.sections).length
  })

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let yPosition = 20
  const pageHeight = pdf.internal.pageSize.height
  const margin = 20
  const lineHeight = 6

  // Helper function to check page break
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, maxWidth: number = 170) => {
    const lines = pdf.splitTextToSize(text, maxWidth)
    if (Array.isArray(lines)) {
      lines.forEach((line: string) => {
        checkPageBreak(lineHeight)
        pdf.text(line, x, yPosition)
        yPosition += lineHeight
      })
    } else {
      checkPageBreak(lineHeight)
      pdf.text(lines, x, yPosition)
      yPosition += lineHeight
    }
  }

  // PDF Header
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('BIM Execution Plan', margin, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(model.header.projectName, margin, yPosition)
  yPosition += 6
  pdf.text(`Generated: ${model.header.generatedDate}`, margin, yPosition)
  yPosition += 15

  // 1. Project Overview
  if (model.sections.overview) {
    checkPageBreak(40)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('1. Project Overview', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const overview = model.sections.overview
    if (overview.projectName) {
      addText(`Project Name: ${overview.projectName}`, margin)
    }
    if (overview.clientName) {
      addText(`Client: ${overview.clientName}`, margin)
    }
    if (overview.location) {
      addText(`Location: ${overview.location}`, margin)
    }
    if (overview.projectType) {
      addText(`Project Type: ${overview.projectType}`, margin)
    }

    // Milestones
    if (overview.milestones && overview.milestones.length > 0) {
      yPosition += 5
      pdf.setFont('helvetica', 'bold')
      addText('Key Milestones:', margin)
      pdf.setFont('helvetica', 'normal')
      
      overview.milestones.forEach((milestone) => {
        checkPageBreak(12)
        if (milestone.name) {
          addText(`• ${milestone.name}${milestone.date ? ` - ${milestone.date}` : ''}`, margin + 5)
          if (milestone.description) {
            addText(`  ${milestone.description}`, margin + 10)
          }
        }
      })
    }
    yPosition += 10
  }

  // 2. Team & Responsibilities
  if (model.sections.team && model.sections.team.firms.length > 0) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('2. Team & Responsibilities', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    model.sections.team.firms.forEach((firm, index) => {
      checkPageBreak(20)
      if (firm.firmName) {
        pdf.setFont('helvetica', 'bold')
        addText(`${index + 1}. ${firm.firmName}`, margin)
        pdf.setFont('helvetica', 'normal')
        
        if (firm.discipline) addText(`Discipline: ${firm.discipline}`, margin + 5)
        if (firm.bimLead) addText(`BIM Lead: ${firm.bimLead}`, margin + 5)
        if (firm.contact) addText(`Contact: ${firm.contact}`, margin + 5)
        yPosition += 3
      }
    })
    yPosition += 10
  }

  // 3. Software Overview
  if (model.sections.software && (model.sections.software.mainTools.length > 0 || model.sections.software.teamTools.length > 0)) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('3. Software Overview', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    if (model.sections.software.mainTools.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Main BIM Tools:', margin)
      pdf.setFont('helvetica', 'normal')
      
      model.sections.software.mainTools.forEach((tool) => {
        if (tool.tool) {
          let toolText = `• ${tool.tool}`
          if (tool.version) toolText += ` ${tool.version}`
          if (tool.discipline) toolText += ` (${tool.discipline})`
          addText(toolText, margin + 5)
        }
      })
      yPosition += 5
    }

    if (model.sections.software.teamTools.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Team-Specific Tools:', margin)
      pdf.setFont('helvetica', 'normal')
      
      model.sections.software.teamTools.forEach((tool) => {
        if (tool.tool) {
          let toolText = `• ${tool.tool}`
          if (tool.version) toolText += ` ${tool.version}`
          if (tool.discipline) toolText += ` (${tool.discipline})`
          addText(toolText, margin + 5)
        }
      })
    }
    yPosition += 10
  }

  // 4. Modeling Scope
  if (model.sections.modeling) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('4. Modeling Scope & LOD', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const modeling = model.sections.modeling
    if (modeling.generalLod) {
      addText(`General LOD: ${modeling.generalLod}`, margin)
    }
    if (modeling.units) {
      addText(`Units: ${modeling.units}`, margin)
    }
    if (modeling.datumStrategy) {
      addText(`Datum Strategy: ${modeling.datumStrategy}`, margin)
    }

    if (modeling.disciplineLods && modeling.disciplineLods.length > 0) {
      yPosition += 5
      pdf.setFont('helvetica', 'bold')
      addText('Discipline-Specific LODs:', margin)
      pdf.setFont('helvetica', 'normal')
      
      modeling.disciplineLods.forEach((lod) => {
        if (lod.discipline && lod.level) {
          addText(`• ${lod.discipline}: ${lod.level}`, margin + 5)
          if (lod.description) {
            addText(`  ${lod.description}`, margin + 10)
          }
        }
      })
    }

    if (modeling.exceptions && modeling.exceptions.length > 0) {
      yPosition += 5
      pdf.setFont('helvetica', 'bold')
      addText('Exceptions:', margin)
      pdf.setFont('helvetica', 'normal')
      
      modeling.exceptions.forEach((exception) => {
        addText(`• ${exception}`, margin + 5)
      })
    }
    yPosition += 10
  }

  // 5. File Naming (if specified)
  if (model.sections.naming) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('5. File Naming Conventions', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const naming = model.sections.naming
    addText(`Use Conventions: ${naming.useConventions ? 'Yes' : 'No'}`, margin)
    
    if (naming.prefixFormat) {
      addText(`Prefix Format: ${naming.prefixFormat}`, margin)
    }
    if (naming.disciplineCodes) {
      addText(`Discipline Codes: ${naming.disciplineCodes}`, margin)
    }
    if (naming.versioningFormat) {
      addText(`Versioning Format: ${naming.versioningFormat}`, margin)
    }

    if (naming.examples && naming.examples.length > 0) {
      yPosition += 5
      pdf.setFont('helvetica', 'bold')
      addText('Examples:', margin)
      pdf.setFont('helvetica', 'normal')
      
      naming.examples.forEach((example) => {
        addText(`• ${example}`, margin + 5)
      })
    }
    yPosition += 10
  }

  // 6. Collaboration & CDE
  if (model.sections.collaboration) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('6. Collaboration & CDE', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const collab = model.sections.collaboration
    if (collab.platform) {
      addText(`Platform: ${collab.platform}`, margin)
    }
    if (collab.linkingMethod) {
      addText(`File Linking Method: ${collab.linkingMethod}`, margin)
    }
    if (collab.sharingFrequency) {
      addText(`Sharing Frequency: ${collab.sharingFrequency}`, margin)
    }
    if (collab.setupResponsibility) {
      addText(`Setup Responsibility: ${collab.setupResponsibility}`, margin)
    }
    if (collab.accessControls) {
      addText(`Access Controls: ${collab.accessControls}`, margin)
    }
    yPosition += 10
  }

  // 7. Geolocation
  if (model.sections.geolocation) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('7. Geolocation & Coordinates', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const geo = model.sections.geolocation
    addText(`Georeferenced: ${geo.isGeoreferenced ? 'Yes' : 'No'}`, margin)
    
    if (geo.coordinateSetup) {
      addText(`Coordinate Setup: ${geo.coordinateSetup}`, margin)
    }
    if (geo.originLocation) {
      addText(`Origin Location: ${geo.originLocation}`, margin)
    }
    if (geo.coordinateSystem) {
      addText(`Coordinate System: ${geo.coordinateSystem}`, margin)
    }
    yPosition += 10
  }

  // 8. Model Checking
  if (model.sections.checking) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('8. Model Checking & Coordination', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const checking = model.sections.checking
    if (checking.clashDetectionTools && checking.clashDetectionTools.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Clash Detection Tools:', margin)
      pdf.setFont('helvetica', 'normal')
      checking.clashDetectionTools.forEach((tool) => {
        addText(`• ${tool}`, margin + 5)
      })
      yPosition += 5
    }
    
    if (checking.coordinationProcess) {
      addText(`Coordination Process: ${checking.coordinationProcess}`, margin)
    }
    if (checking.meetingFrequency) {
      addText(`Meeting Frequency: ${checking.meetingFrequency}`, margin)
    }
    if (checking.responsibilityMatrix) {
      addText(`Responsibility Matrix: ${checking.responsibilityMatrix}`, margin)
    }
    yPosition += 10
  }

  // 9. Outputs & Deliverables
  if (model.sections.outputs) {
    checkPageBreak(30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('9. Outputs & Deliverables', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const outputs = model.sections.outputs
    
    if (outputs.deliverablesByPhase && outputs.deliverablesByPhase.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Deliverables by Phase:', margin)
      pdf.setFont('helvetica', 'normal')
      
      outputs.deliverablesByPhase.forEach((phase) => {
        if (phase.phase) {
          checkPageBreak(15)
          pdf.setFont('helvetica', 'bold')
          addText(`${phase.phase}:`, margin + 5)
          pdf.setFont('helvetica', 'normal')
          
          if (phase.deliverables && phase.deliverables.length > 0) {
            phase.deliverables.forEach((deliverable) => {
              addText(`• ${deliverable}`, margin + 10)
            })
          }
          
          if (phase.formats && phase.formats.length > 0) {
            addText(`Formats: ${phase.formats.join(', ')}`, margin + 10)
          }
          
          if (phase.responsibility) {
            addText(`Responsibility: ${phase.responsibility}`, margin + 10)
          }
          yPosition += 3
        }
      })
      yPosition += 5
    }

    if (outputs.formatsStandards && outputs.formatsStandards.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Format Standards:', margin)
      pdf.setFont('helvetica', 'normal')
      outputs.formatsStandards.forEach((format) => {
        addText(`• ${format}`, margin + 5)
      })
      yPosition += 5
    }

    if (outputs.milestoneSchedule && outputs.milestoneSchedule.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Milestone Schedule:', margin)
      pdf.setFont('helvetica', 'normal')
      
      outputs.milestoneSchedule.forEach((milestone) => {
        if (milestone.milestone) {
          addText(`• ${milestone.milestone}${milestone.deadline ? ` - ${milestone.deadline}` : ''}`, margin + 5)
          if (milestone.deliverables && milestone.deliverables.length > 0) {
            addText(`  Deliverables: ${milestone.deliverables.join(', ')}`, margin + 10)
          }
        }
      })
    }
  }

  // Footer
  checkPageBreak(20)
  yPosition = pageHeight - 15
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Generated by BIMxPlan Go | Project ID: ${projectId}`, margin, yPosition)
  pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageHeight - 30, yPosition)

  console.log('[BEP-PDF-RENDERER]', {
    timestamp: new Date().toISOString(),
    action: 'RENDER_SUCCESS',
    projectId,
    totalPages: pdf.getCurrentPageInfo().pageNumber,
    sectionsRendered: Object.keys(model.sections).length
  })

  return pdf
}