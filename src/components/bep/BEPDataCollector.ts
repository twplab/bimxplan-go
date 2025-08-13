import { supabase } from "@/integrations/supabase/client"
import { ProjectData } from "@/lib/supabase"

/**
 * Single source of truth for BEP data collection
 * Used by both Live Preview and PDF Export to ensure consistency
 */

export interface BEPExportData {
  projectId: string
  lastUpdated: string
  sections: {
    overview: ProjectOverviewData
    team: TeamData
    software: SoftwareData
    modeling: ModelingData
    naming: FileNamingData
    collaboration: CollaborationData
    geolocation: GeolocationData
    checking: ModelCheckingData
    outputs: OutputsData
  }
}

interface ProjectOverviewData {
  project_name: string
  client_name: string
  location: string
  project_type: string
  key_milestones: Array<{
    name: string
    date: string
    description: string
  }>
}

interface TeamData {
  firms: Array<{
    name: string
    discipline: string
    bim_lead: string
    contact_info: string
  }>
}

interface SoftwareData {
  main_tools: Array<{
    name: string
    version: string
    discipline: string
    usage: string
  }>
  team_specific_tools: Array<{
    name: string
    version: string
    discipline: string
    usage: string
  }>
}

interface ModelingData {
  general_lod: string
  discipline_lods: Array<{
    discipline: string
    lod_level: string
    description: string
  }>
  exceptions: string[]
  units: string
  levels_grids_strategy: string
}

interface FileNamingData {
  use_conventions: boolean
  prefix_format: string
  discipline_codes: string
  versioning_format: string
  examples: string[]
}

interface CollaborationData {
  platform: string
  file_linking_method: string
  sharing_frequency: string
  setup_responsibility: string
  access_controls: string
}

interface GeolocationData {
  is_georeferenced: boolean
  coordinate_setup: string
  origin_location: string
  coordinate_system: string
}

interface ModelCheckingData {
  clash_detection_tools: string[]
  coordination_process: string
  meeting_frequency: string
  responsibility_matrix: string
}

interface OutputsData {
  deliverables_by_phase: Array<{
    phase: string
    deliverables: string[]
    formats: string[]
    responsibility: string
  }>
  formats_standards: string[]
  milestone_schedule: Array<{
    milestone: string
    deadline: string
    deliverables: string[]
  }>
}

/**
 * Fetches fresh BEP data from database
 * @param projectId - The project ID to fetch data for
 * @returns Complete BEP data structure
 */
export async function getBepExportData(projectId: string): Promise<BEPExportData> {
  const logData = {
    timestamp: new Date().toISOString(),
    action: 'DATA_COLLECTION_START',
    projectId
  }
  console.log('[BEP-DATA-COLLECTOR]', logData)

  try {
    // Check access first
    const { data: hasAccess, error: accessError } = await supabase
      .rpc('user_can_access_project', { project_uuid: projectId })
    
    if (accessError) {
      throw new Error(`Access check failed: ${accessError.message}`)
    }
    
    if (!hasAccess) {
      throw new Error('You do not have access to this project')
    }

    // Fetch project data
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    if (fetchError) {
      throw new Error(`Failed to fetch project: ${fetchError.message}`)
    }

    if (!project) {
      throw new Error('Project not found')
    }

    const projectData = (project.project_data as ProjectData) || {} as ProjectData
    
    const exportData: BEPExportData = {
      projectId,
      lastUpdated: project.updated_at,
      sections: {
        overview: projectData?.project_overview || {
          project_name: '',
          client_name: '',
          location: '',
          project_type: '',
          key_milestones: []
        },
        team: {
          firms: projectData?.team_responsibilities?.firms || []
        },
        software: {
          main_tools: projectData?.software_overview?.main_tools || [],
          team_specific_tools: projectData?.software_overview?.team_specific_tools || []
        },
        modeling: {
          general_lod: projectData?.modeling_scope?.general_lod || '',
          discipline_lods: projectData?.modeling_scope?.discipline_lods || [],
          exceptions: projectData?.modeling_scope?.exceptions || [],
          units: projectData?.modeling_scope?.units || '',
          levels_grids_strategy: projectData?.modeling_scope?.levels_grids_strategy || ''
        },
        naming: {
          use_conventions: projectData?.file_naming?.use_conventions || false,
          prefix_format: projectData?.file_naming?.prefix_format || '',
          discipline_codes: projectData?.file_naming?.discipline_codes || '',
          versioning_format: projectData?.file_naming?.versioning_format || '',
          examples: projectData?.file_naming?.examples || []
        },
        collaboration: {
          platform: projectData?.collaboration_cde?.platform || '',
          file_linking_method: projectData?.collaboration_cde?.file_linking_method || '',
          sharing_frequency: projectData?.collaboration_cde?.sharing_frequency || '',
          setup_responsibility: projectData?.collaboration_cde?.setup_responsibility || '',
          access_controls: projectData?.collaboration_cde?.access_controls || ''
        },
        geolocation: {
          is_georeferenced: projectData?.geolocation?.is_georeferenced || false,
          coordinate_setup: projectData?.geolocation?.coordinate_setup || '',
          origin_location: projectData?.geolocation?.origin_location || '',
          coordinate_system: projectData?.geolocation?.coordinate_system || ''
        },
        checking: {
          clash_detection_tools: projectData?.model_checking?.clash_detection_tools || [],
          coordination_process: projectData?.model_checking?.coordination_process || '',
          meeting_frequency: projectData?.model_checking?.meeting_frequency || '',
          responsibility_matrix: projectData?.model_checking?.responsibility_matrix || ''
        },
        outputs: {
          deliverables_by_phase: projectData?.outputs_deliverables?.deliverables_by_phase || [],
          formats_standards: projectData?.outputs_deliverables?.formats_standards || [],
          milestone_schedule: projectData?.outputs_deliverables?.milestone_schedule || []
        }
      }
    }

    console.log('[BEP-DATA-COLLECTOR]', {
      ...logData,
      action: 'DATA_COLLECTION_SUCCESS',
      dataSize: JSON.stringify(exportData).length,
      sectionsFound: Object.keys(exportData.sections).length
    })

    return exportData
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.log('[BEP-DATA-COLLECTOR]', {
      ...logData,
      action: 'DATA_COLLECTION_ERROR',
      error: errorMessage
    })
    throw error
  }
}

/**
 * Ensures all pending saves are flushed before export
 * @param projectId - The project ID
 * @param currentData - Current form data to save
 */
export async function ensureLatestSave(projectId: string, currentData: Partial<ProjectData>): Promise<void> {
  console.log('[BEP-DATA-COLLECTOR]', {
    timestamp: new Date().toISOString(),
    action: 'ENSURE_LATEST_SAVE_START',
    projectId,
    dataSize: JSON.stringify(currentData).length
  })

  try {
    const { error } = await supabase
      .from('projects')
      .update({ 
        project_data: currentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (error) {
      throw new Error(`Failed to save: ${error.message}`)
    }

    console.log('[BEP-DATA-COLLECTOR]', {
      timestamp: new Date().toISOString(),
      action: 'ENSURE_LATEST_SAVE_SUCCESS',
      projectId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.log('[BEP-DATA-COLLECTOR]', {
      timestamp: new Date().toISOString(),
      action: 'ENSURE_LATEST_SAVE_ERROR',
      projectId,
      error: errorMessage
    })
    throw error
  }
}