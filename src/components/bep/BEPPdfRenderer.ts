import jsPDF from 'jspdf'
import { PdfModel } from './BEPPdfMapper'
import { supabase } from "@/integrations/supabase/client"
import logoUrl from "@/assets/bimxplan-logo.png"

/**
 * Helper function to generate PDF filename
 */
export function generatePdfFilename(projectName: string): string {
  const safeName = projectName.replace(/[^a-zA-Z0-9]/g, '_') || 'BEP_Project'
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:\-T]/g, '_')
  return `${safeName}_BEP_Summary_${timestamp}.pdf`
}

/**
 * Convert image to base64 for PDF embedding
 */
async function getLogoAsBase64(): Promise<string> {
  try {
    // Create a fallback base64 logo in case the file loading fails
    const fallbackLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    // Try to load the actual logo
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.log('[BEP-PDF-RENDERER] Logo fetch failed, using fallback')
      return fallbackLogo
    }
    
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(fallbackLogo)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.log('[BEP-PDF-RENDERER] Logo conversion error:', error)
    // Return a minimal transparent PNG as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
}

/**
 * Create version entry in database
 */
export async function createVersionEntry(
  projectId: string, 
  exportData: Record<string, unknown>, 
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
        project_data: exportData as any,
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

  // Load logo as base64
  const logoBase64 = await getLogoAsBase64()

  let yPosition = 25
  const pageWidth = pdf.internal.pageSize.width
  const pageHeight = pdf.internal.pageSize.height
  const margin = 20
  const lineHeight = 8 // Increased for better readability
  const footerHeight = 30 // Increased footer height for better spacing
  const logoSize = 8 // Slightly larger logo
  const sectionSpacing = 15 // More spacing between sections
  const contentWidth = pageWidth - (margin * 2) // Dynamic content width
  const paragraphSpacing = 4 // Extra spacing between paragraphs
  const listItemIndent = 8 // Consistent list indentation

  // Helper function to add footer and logo to current page
  const addFooterAndLogo = () => {
    const currentPage = pdf.getCurrentPageInfo().pageNumber
    const totalPages = pdf.getNumberOfPages()
    
    // Add footer
    const footerY = pageHeight - 10
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(128, 128, 128) // Gray color
    
    // Left side: Project info
    pdf.text(`${model.header.projectName} • BEP Summary`, margin, footerY)
    pdf.text(`Project ID: ${projectId}`, margin, footerY + 3)
    
    // Center: Export timestamp
    const exportTime = new Date().toLocaleString()
    pdf.text(`Exported: ${exportTime}`, pageWidth / 2, footerY, { align: 'center' })
    
    // Right side: Page numbers
    pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' })
    
    // Add logo at lower-right corner
    try {
      pdf.addImage(logoBase64, 'PNG', pageWidth - margin - logoSize, footerY - logoSize - 2, logoSize, logoSize)
    } catch (error) {
      console.log('[BEP-PDF-RENDERER] Logo embedding failed:', error)
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0)
  }

  // Helper function to check page break with footer space
  const checkPageBreak = (requiredHeight: number = lineHeight) => {
    if (yPosition + requiredHeight > pageHeight - footerHeight - margin) {
      addFooterAndLogo() // Add footer/logo to current page before breaking
      pdf.addPage()
      yPosition = margin + 5 // Start with some padding from top
      return true
    }
    return false
  }

  // Helper function to add text with word wrapping and better spacing
  const addText = (text: string, x: number = margin, maxWidth?: number, extraSpacing: number = 0) => {
    if (!text || text.trim() === '') return
    
    const textWidth = maxWidth || (contentWidth - (x - margin))
    const lines = pdf.splitTextToSize(text, textWidth)
    
    if (Array.isArray(lines)) {
      // Check if we need a page break for all lines
      const totalHeight = lines.length * lineHeight + extraSpacing
      checkPageBreak(totalHeight)
      
      lines.forEach((line: string, index: number) => {
        pdf.text(line, x, yPosition)
        yPosition += lineHeight
      })
      yPosition += extraSpacing
    } else {
      checkPageBreak(lineHeight + extraSpacing)
      pdf.text(lines, x, yPosition)
      yPosition += lineHeight + extraSpacing
    }
  }
  
  // Helper function to add section headers with consistent spacing
  const addSectionHeader = (title: string, fontSize: number = 16) => {
    // Ensure enough space for header and some content
    checkPageBreak(sectionSpacing + lineHeight + 10)
    yPosition += sectionSpacing // Add spacing before section
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin, yPosition)
    yPosition += lineHeight + 8 // Extra space after headers for better separation
    pdf.setFontSize(11) // Slightly larger body text for better readability
    pdf.setFont('helvetica', 'normal')
  }

  // Helper function to add field with proper spacing
  const addField = (label: string, value: string, indent: number = 0) => {
    if (!value || value.trim() === '') return
    addText(`${label}: ${value}`, margin + indent, undefined, paragraphSpacing)
  }

  // Helper function to add list items with proper indentation
  const addListItem = (text: string, indent: number = listItemIndent) => {
    if (!text || text.trim() === '') return
    addText(`• ${text}`, margin + indent, undefined, 2)
  }

  // PDF Header with professional styling
  pdf.setFontSize(26)
  pdf.setFont('helvetica', 'bold')
  pdf.text('BIM EXECUTION PLAN', margin, yPosition)
  yPosition += 12

  // Add a subtle separator line
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(model.header.projectName, margin, yPosition)
  yPosition += 8

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100) // Gray text for metadata
  pdf.text(`Generated: ${model.header.generatedDate}`, margin, yPosition)
  yPosition += 6
  pdf.text(`Client: ${model.header.clientName}`, margin, yPosition)
  yPosition += 18
  pdf.setTextColor(0, 0, 0) // Reset to black

  // 1. Project Overview
  if (model.sections.overview) {
    addSectionHeader('1. Project Overview')

    const overview = model.sections.overview
    addField('Project Name', overview.projectName)
    addField('Client', overview.clientName)
    addField('Location', overview.location)
    addField('Project Type', overview.projectType)

    // Milestones
    if (overview.milestones && overview.milestones.length > 0) {
      yPosition += paragraphSpacing
      pdf.setFont('helvetica', 'bold')
      addText('Key Milestones:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      overview.milestones.forEach((milestone) => {
        if (milestone.name) {
          const milestoneText = `${milestone.name}${milestone.date ? ` - ${milestone.date}` : ''}`
          addListItem(milestoneText)
          if (milestone.description) {
            addText(milestone.description, margin + listItemIndent + 5, undefined, 2)
          }
        }
      })
    }
  }

  // 2. Team & Responsibilities
  if (model.sections.team && model.sections.team.firms.length > 0) {
    addSectionHeader('2. Team & Responsibilities')

    model.sections.team.firms.forEach((firm, index) => {
      if (firm.firmName) {
        pdf.setFont('helvetica', 'bold')
        addText(`${index + 1}. ${firm.firmName}`, margin, undefined, paragraphSpacing)
        pdf.setFont('helvetica', 'normal')
        
        addField('Discipline', firm.discipline, listItemIndent)
        addField('BIM Lead', firm.bimLead, listItemIndent)
        addField('Contact', firm.contact, listItemIndent)
        yPosition += paragraphSpacing
      }
    })
  }

  // 3. Software Overview
  if (model.sections.software && (model.sections.software.mainTools.length > 0 || model.sections.software.teamTools.length > 0)) {
    addSectionHeader('3. Software Overview')

    if (model.sections.software.mainTools.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Main BIM Tools:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      model.sections.software.mainTools.forEach((tool) => {
        if (tool.tool) {
          let toolText = tool.tool
          if (tool.version) toolText += ` ${tool.version}`
          if (tool.discipline) toolText += ` (${tool.discipline})`
          addListItem(toolText)
        }
      })
      yPosition += paragraphSpacing
    }

    if (model.sections.software.teamTools.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Team-Specific Tools:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      model.sections.software.teamTools.forEach((tool) => {
        if (tool.tool) {
          let toolText = tool.tool
          if (tool.version) toolText += ` ${tool.version}`
          if (tool.discipline) toolText += ` (${tool.discipline})`
          addListItem(toolText)
        }
      })
    }
  }

  // 4. Modeling Scope
  if (model.sections.modeling) {
    addSectionHeader('4. Modeling Scope & LOD')

    const modeling = model.sections.modeling
    addField('General LOD', modeling.generalLod)
    addField('Units', modeling.units)
    addField('Datum Strategy', modeling.datumStrategy)

    if (modeling.disciplineLods && modeling.disciplineLods.length > 0) {
      yPosition += paragraphSpacing
      pdf.setFont('helvetica', 'bold')
      addText('Discipline-Specific LODs:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      modeling.disciplineLods.forEach((lod) => {
        if (lod.discipline && lod.level) {
          addListItem(`${lod.discipline}: ${lod.level}`)
          if (lod.description) {
            addText(lod.description, margin + listItemIndent + 5, undefined, 2)
          }
        }
      })
    }

    if (modeling.exceptions && modeling.exceptions.length > 0) {
      yPosition += paragraphSpacing
      pdf.setFont('helvetica', 'bold')
      addText('Exceptions:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      modeling.exceptions.forEach((exception) => {
        addListItem(exception)
      })
    }
  }

  // 5. File Naming (if specified)
  if (model.sections.naming) {
    addSectionHeader('5. File Naming Conventions')

    const naming = model.sections.naming
    addField('Use Conventions', naming.useConventions ? 'Yes' : 'No')
    addField('Prefix Format', naming.prefixFormat)
    addField('Discipline Codes', naming.disciplineCodes)
    addField('Versioning Format', naming.versioningFormat)

    if (naming.examples && naming.examples.length > 0) {
      yPosition += paragraphSpacing
      pdf.setFont('helvetica', 'bold')
      addText('Examples:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      naming.examples.forEach((example) => {
        addListItem(example)
      })
    }
  }

  // 6. Collaboration & CDE
  if (model.sections.collaboration) {
    addSectionHeader('6. Collaboration & CDE')

    const collab = model.sections.collaboration
    addField('Platform', collab.platform)
    addField('File Linking Method', collab.linkingMethod)
    addField('Sharing Frequency', collab.sharingFrequency)
    addField('Setup Responsibility', collab.setupResponsibility)
    addField('Access Controls', collab.accessControls)
  }

  // 7. Geolocation
  if (model.sections.geolocation) {
    addSectionHeader('7. Geolocation & Coordinates')

    const geo = model.sections.geolocation
    addField('Georeferenced', geo.isGeoreferenced ? 'Yes' : 'No')
    addField('Coordinate Setup', geo.coordinateSetup)
    addField('Origin Location', geo.originLocation)
    addField('Coordinate System', geo.coordinateSystem)
  }

  // 8. Model Checking
  if (model.sections.checking) {
    addSectionHeader('8. Model Checking & Coordination')

    const checking = model.sections.checking
    if (checking.clashDetectionTools && checking.clashDetectionTools.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Clash Detection Tools:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      checking.clashDetectionTools.forEach((tool) => {
        addListItem(tool)
      })
      yPosition += paragraphSpacing
    }
    
    addField('Coordination Process', checking.coordinationProcess)
    addField('Meeting Frequency', checking.meetingFrequency)
    addField('Responsibility Matrix', checking.responsibilityMatrix)
  }

  // 9. Outputs & Deliverables
  if (model.sections.outputs) {
    addSectionHeader('9. Outputs & Deliverables')

    const outputs = model.sections.outputs
    
    if (outputs.deliverablesByPhase && outputs.deliverablesByPhase.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Deliverables by Phase:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      outputs.deliverablesByPhase.forEach((phase) => {
        if (phase.phase) {
          pdf.setFont('helvetica', 'bold')
          addText(`${phase.phase}:`, margin + listItemIndent, undefined, paragraphSpacing)
          pdf.setFont('helvetica', 'normal')
          
          if (phase.deliverables && phase.deliverables.length > 0) {
            phase.deliverables.forEach((deliverable) => {
              addListItem(deliverable, listItemIndent + 5)
            })
          }
          
          if (phase.formats && phase.formats.length > 0) {
            addField('Formats', phase.formats.join(', '), listItemIndent + 5)
          }
          
          if (phase.responsibility) {
            addField('Responsibility', phase.responsibility, listItemIndent + 5)
          }
          yPosition += paragraphSpacing
        }
      })
      yPosition += paragraphSpacing
    }

    if (outputs.formatsStandards && outputs.formatsStandards.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Format Standards:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      outputs.formatsStandards.forEach((format) => {
        addListItem(format)
      })
      yPosition += paragraphSpacing
    }

    if (outputs.milestoneSchedule && outputs.milestoneSchedule.length > 0) {
      pdf.setFont('helvetica', 'bold')
      addText('Milestone Schedule:', margin, undefined, paragraphSpacing)
      pdf.setFont('helvetica', 'normal')
      
      outputs.milestoneSchedule.forEach((milestone) => {
        if (milestone.milestone) {
          const milestoneText = `${milestone.milestone}${milestone.deadline ? ` - ${milestone.deadline}` : ''}`
          addListItem(milestoneText)
          if (milestone.deliverables && milestone.deliverables.length > 0) {
            addText(`Deliverables: ${milestone.deliverables.join(', ')}`, margin + listItemIndent + 5, undefined, 2)
          }
        }
      })
    }
  }

  // Add footer and logo to the final page
  addFooterAndLogo()

  // Update total page count in all footers
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    addFooterAndLogo()
  }

  console.log('[BEP-PDF-RENDERER]', {
    timestamp: new Date().toISOString(),
    action: 'RENDER_SUCCESS',
    projectId,
    totalPages: pdf.getCurrentPageInfo().pageNumber,
    sectionsRendered: Object.keys(model.sections).length
  })

  return pdf
}