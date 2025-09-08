import { BEPExportData } from "./BEPDataCollector"

/**
 * PDF Model - Clean, normalized structure for PDF generation
 */
export interface PdfModel {
  header: {
    projectName: string
    clientName: string
    generatedDate: string
    projectId: string
  }
  sections: {
    overview?: ProjectOverviewSection
    team?: TeamSection
    software?: SoftwareSection
    modeling?: ModelingSection
    naming?: FileNamingSection
    collaboration?: CollaborationSection
    geolocation?: GeolocationSection
    checking?: ModelCheckingSection
    outputs?: OutputsSection
  }
}

interface ProjectOverviewSection {
  projectName: string
  clientName: string
  location: string
  projectType: string
  milestones: Array<{
    name: string
    date: string
    description: string
  }>
}

interface TeamSection {
  firms: Array<{
    firmName: string
    discipline: string
    bimLead: string
    contact: string
  }>
}

interface SoftwareSection {
  mainTools: Array<{
    tool: string
    version: string
    discipline: string
    usage: string
  }>
  teamTools: Array<{
    tool: string
    version: string
    discipline: string
    usage: string
  }>
}

interface ModelingSection {
  generalLod: string
  disciplineLods: Array<{
    discipline: string
    level: string
    description: string
  }>
  exceptions: string[]
  units: string
  datumStrategy: string
}

interface FileNamingSection {
  useConventions: boolean
  prefixFormat: string
  disciplineCodes: string
  versioningFormat: string
  examples: string[]
}

interface CollaborationSection {
  platform: string
  linkingMethod: string
  sharingFrequency: string
  setupResponsibility: string
  accessControls: string
}

interface GeolocationSection {
  isGeoreferenced: boolean
  coordinateSetup: string
  originLocation: string
  coordinateSystem: string
}

interface ModelCheckingSection {
  clashDetectionTools: string[]
  coordinationProcess: string
  meetingFrequency: string
  responsibilityMatrix: string
}

interface OutputsSection {
  deliverablesByPhase: Array<{
    phase: string
    deliverables: string[]
    formats: string[]
    responsibility: string
  }>
  formatsStandards: string[]
  milestoneSchedule: Array<{
    milestone: string
    deadline: string
    deliverables: string[]
  }>
}

/**
 * Safe string utility - returns empty string for null/undefined/empty values
 */
function safe(val?: string | null): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val.trim()
  return String(val).trim()
}

/**
 * Check if array has meaningful content
 */
function nonEmpty<T>(arr?: T[] | null): arr is T[] {
  return Array.isArray(arr) && arr.length > 0
}

/**
 * Check if string has meaningful content
 */
function hasContent(val?: string | null): boolean {
  return safe(val).length > 0
}

/**
 * Maps BEP export data to clean PDF model
 * Removes empty sections and fields to avoid "Not specified" clutter
 */
export function mapProjectDataToPdfModel(data: BEPExportData): PdfModel {
  console.log('[BEP-PDF-MAPPER]', {
    timestamp: new Date().toISOString(),
    action: 'MAPPING_START',
    projectId: data.projectId,
    dataSize: JSON.stringify(data).length
  })

  const model: PdfModel = {
    header: {
      projectName: safe(data.projectOverview?.project_name) || 'Untitled Project',
      clientName: safe(data.projectOverview?.client_name) || 'Client Not Specified', 
      generatedDate: new Date().toLocaleDateString(),
      projectId: data.projectId
    },
    sections: {}
  }

  // 1. Project Overview - Always include if basic project info exists
  const overview = data.projectOverview
  if (overview && (hasContent(overview.project_name) || hasContent(overview.client_name) || 
      hasContent(overview.location) || hasContent(overview.project_type) ||
      nonEmpty(overview.key_milestones))) {
    
    model.sections.overview = {
      projectName: safe(overview.project_name),
      clientName: safe(overview.client_name),
      location: safe(overview.location),
      projectType: safe(overview.project_type),
      milestones: nonEmpty(overview.key_milestones) 
        ? overview.key_milestones
            .filter(m => hasContent(m.name) || hasContent(m.date))
            .map(m => ({
              name: safe(m.name),
              date: safe(m.date),
              description: safe(m.description)
            }))
        : []
    }
  }

  // 2. Team & Responsibilities - Include if any team data exists
  const team = data.teamResponsibilities
  if (team && nonEmpty(team.firms)) {
    const validFirms = team.firms
      .filter(f => hasContent(f.name) || hasContent(f.discipline) || hasContent(f.bim_lead))
      .map(f => ({
        firmName: safe(f.name),
        discipline: safe(f.discipline),
        bimLead: safe(f.bim_lead),
        contact: safe(f.contact_info)
      }))
    
    if (validFirms.length > 0) {
      model.sections.team = { firms: validFirms }
    }
  }

  // 3. Software Overview - Include if any software data exists
  const software = data.softwareOverview  
  if (software && (nonEmpty(software.main_tools) || nonEmpty(software.team_specific_tools))) {
    const mainTools = nonEmpty(software.main_tools)
      ? software.main_tools
          .filter(t => hasContent(t.name))
          .map(t => ({
            tool: safe(t.name),
            version: safe(t.version),
            discipline: safe(t.discipline),
            usage: safe(t.usage)
          }))
      : []

    const teamTools = nonEmpty(software.team_specific_tools)
      ? software.team_specific_tools
          .filter(t => hasContent(t.name))
          .map(t => ({
            tool: safe(t.name),
            version: safe(t.version),
            discipline: safe(t.discipline),
            usage: safe(t.usage)
          }))
      : []

    if (mainTools.length > 0 || teamTools.length > 0) {
      model.sections.software = { mainTools, teamTools }
    }
  }

  // 4. Modeling Scope - Include if any modeling data exists
  const modeling = data.modelingScope
  if (modeling && (hasContent(modeling.general_lod) || hasContent(modeling.units) || 
      hasContent(modeling.levels_grids_strategy) || nonEmpty(modeling.discipline_lods) ||
      nonEmpty(modeling.exceptions))) {
    
    model.sections.modeling = {
      generalLod: safe(modeling.general_lod),
      disciplineLods: nonEmpty(modeling.discipline_lods)
        ? modeling.discipline_lods
            .filter(d => hasContent(d.discipline) || hasContent(d.lod_level))
            .map(d => ({
              discipline: safe(d.discipline),
              level: safe(d.lod_level),
              description: safe(d.description)
            }))
        : [],
      exceptions: nonEmpty(modeling.exceptions) 
        ? modeling.exceptions.filter(e => hasContent(e))
        : [],
      units: safe(modeling.units),
      datumStrategy: safe(modeling.levels_grids_strategy)
    }
  }

  // 5. File Naming - Include if any naming data exists
  const naming = data.fileNaming
  if (naming && (naming.use_conventions || hasContent(naming.prefix_format) || 
      hasContent(naming.discipline_codes) || hasContent(naming.versioning_format) ||
      nonEmpty(naming.examples))) {
    
    model.sections.naming = {
      useConventions: naming.use_conventions,
      prefixFormat: safe(naming.prefix_format),
      disciplineCodes: safe(naming.discipline_codes),
      versioningFormat: safe(naming.versioning_format),
      examples: nonEmpty(naming.examples) 
        ? naming.examples.filter(e => hasContent(e))
        : []
    }
  }

  // 6. Collaboration & CDE - Include if any collaboration data exists
  const collab = data.collaborationCDE
  if (collab && (hasContent(collab.platform) || hasContent(collab.file_linking_method) ||
      hasContent(collab.sharing_frequency) || hasContent(collab.setup_responsibility) ||
      hasContent(collab.access_controls))) {
    
    model.sections.collaboration = {
      platform: safe(collab.platform),
      linkingMethod: safe(collab.file_linking_method),
      sharingFrequency: safe(collab.sharing_frequency),
      setupResponsibility: safe(collab.setup_responsibility),
      accessControls: safe(collab.access_controls)
    }
  }

  // 7. Geolocation - Include if any geolocation data exists
  const geo = data.geolocation
  if (geo && (geo.is_georeferenced !== undefined || hasContent(geo.coordinate_setup) ||
      hasContent(geo.origin_location) || hasContent(geo.coordinate_system))) {
    
    model.sections.geolocation = {
      isGeoreferenced: geo.is_georeferenced,
      coordinateSetup: safe(geo.coordinate_setup),
      originLocation: safe(geo.origin_location),
      coordinateSystem: safe(geo.coordinate_system)
    }
  }

  // 8. Model Checking - Include if any checking data exists
  const checking = data.modelChecking
  if (checking && (nonEmpty(checking.clash_detection_tools) || hasContent(checking.coordination_process) ||
      hasContent(checking.meeting_frequency) || hasContent(checking.responsibility_matrix))) {
    
    model.sections.checking = {
      clashDetectionTools: nonEmpty(checking.clash_detection_tools)
        ? checking.clash_detection_tools.filter(t => hasContent(t))
        : [],
      coordinationProcess: safe(checking.coordination_process),
      meetingFrequency: safe(checking.meeting_frequency),
      responsibilityMatrix: safe(checking.responsibility_matrix)
    }
  }

  // 9. Outputs & Deliverables - Include if any output data exists  
  const outputs = data.outputsDeliverables
  if (outputs && (nonEmpty(outputs.deliverables_by_phase) || nonEmpty(outputs.formats_standards) ||
      nonEmpty(outputs.milestone_schedule))) {
    
    model.sections.outputs = {
      deliverablesByPhase: nonEmpty(outputs.deliverables_by_phase)
        ? outputs.deliverables_by_phase
            .filter(d => hasContent(d.phase) || nonEmpty(d.deliverables))
            .map(d => ({
              phase: safe(d.phase),
              deliverables: nonEmpty(d.deliverables) 
                ? d.deliverables.filter(del => hasContent(del))
                : [],
              formats: nonEmpty(d.formats)
                ? d.formats.filter(f => hasContent(f))
                : [],
              responsibility: safe(d.responsibility)
            }))
        : [],
      formatsStandards: nonEmpty(outputs.formats_standards)
        ? outputs.formats_standards.filter(f => hasContent(f))
        : [],
      milestoneSchedule: nonEmpty(outputs.milestone_schedule)
        ? outputs.milestone_schedule
            .filter(m => hasContent(m.milestone) || hasContent(m.deadline))
            .map(m => ({
              milestone: safe(m.milestone),
              deadline: safe(m.deadline),
              deliverables: nonEmpty(m.deliverables)
                ? m.deliverables.filter(d => hasContent(d))
                : []
            }))
        : []
    }
  }

  console.log('[BEP-PDF-MAPPER]', {
    timestamp: new Date().toISOString(),
    action: 'MAPPING_SUCCESS',
    projectId: data.projectId,
    sectionsIncluded: Object.keys(model.sections).length,
    mappedSize: JSON.stringify(model).length
  })

  return model
}