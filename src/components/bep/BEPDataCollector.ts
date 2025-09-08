/**
 * UNIFIED BEP DATA FLOW - SINGLE SOURCE OF TRUTH
 * This is the ONLY place to fetch BEP data for:
 * - Form rehydration
 * - Live preview
 * - Validation
 * - Progress calculation
 * - PDF generation
 */
import { supabase } from "@/integrations/supabase/client"
import { ProjectData, ProjectOverview, TeamResponsibilities, SoftwareOverview, ModelingScope, FileNaming, CollaborationCDE, Geolocation, ModelChecking, OutputsDeliverables } from "@/lib/supabase"
import { bepErrorHandler, withBEPErrorHandling, retryWithBackoff } from "./BEPErrorHandler"
import { validateProjectData } from "./BEPValidationService"
import { bepDataEvents } from "./BEPDataEvents"

/**
 * Unified export data structure used by ALL consumers
 */
export interface BEPExportData {
  projectId: string
  projectName: string
  clientName: string
  location: string
  projectType: string
  status: string
  createdAt: string
  updatedAt: string
  ownerId: string
  
  // BEP sections - direct mapping from project_data
  projectOverview: ProjectOverview
  teamResponsibilities: TeamResponsibilities
  softwareOverview: SoftwareOverview
  modelingScope: ModelingScope
  fileNaming: FileNaming
  collaborationCDE: CollaborationCDE
  geolocation: Geolocation
  modelChecking: ModelChecking
  outputsDeliverables: OutputsDeliverables
  
  // Validation results
  validationIssues: ValidationIssue[]
  
  // Metadata
  exportedAt: string
  exportedBy: string
}

export interface ValidationIssue {
  section: string
  field: string
  message: string
  severity: 'required' | 'recommended' | 'info'
}

/**
 * UNIFIED VALIDATION - Single entry point for all validation
 * Replaces all scattered validation logic throughout the app
 */
export function validateBepData(data: Partial<ProjectData>): ValidationIssue[] {
  console.log('[BEP-UNIFIED-VALIDATION] Running centralized validation:', {
    timestamp: new Date().toISOString(),
    dataKeys: Object.keys(data),
    hasProjectOverview: !!data.project_overview,
    hasTeamResponsibilities: !!data.team_responsibilities,
    hasSoftwareOverview: !!data.software_overview
  })
  
  const report = validateProjectData(data)
  
  console.log('[BEP-UNIFIED-VALIDATION] Validation completed:', {
    totalIssues: report.issues.length,
    errorCount: report.issues.filter(i => i.severity === 'required').length,
    warningCount: report.issues.filter(i => i.severity === 'recommended' || i.severity === 'info').length,
    completeness: report.completeness,
    isValid: report.isValid
  })
  
  return report.issues
}

/**
 * UNIFIED DATA SOURCE - Used by ALL consumers
 * Forms, preview, validation, progress, PDF all use this function
 */
export async function getBepExportData(projectId: string): Promise<BEPExportData> {
  console.log('[BEP-UNIFIED-COLLECTOR] Starting unified data collection for project:', projectId)
  
  try {
    // Check user access first
    const { data: accessData, error: accessError } = await supabase.rpc('user_can_access_project', {
      project_uuid: projectId
    })
    
    if (accessError) {
      console.error('[BEP-UNIFIED-COLLECTOR] Access check failed:', accessError)
      throw new Error(`Access denied: ${accessError.message}`)
    }
    
    if (!accessData) {
      console.error('[BEP-UNIFIED-COLLECTOR] User cannot access project:', projectId)
      throw new Error('You do not have permission to access this project')
    }

    // Fetch project data with retry logic  
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      console.error('[BEP-UNIFIED-COLLECTOR] Project fetch failed:', fetchError)
      throw new Error(`Database error: ${fetchError.message}`)
    }

    if (!project) {
      console.error('[BEP-UNIFIED-COLLECTOR] Project not found:', projectId)
      throw new Error(`Project ${projectId} not found`)
    }

    console.log('[BEP-UNIFIED-COLLECTOR] Project fetched successfully:', {
      id: project.id,
      name: project.name,
      dataSize: JSON.stringify(project.project_data || {}).length
    })

    // Ensure project_data is a valid object
    const projectData: Partial<ProjectData> = (project.project_data as Partial<ProjectData>) || {}
    
    // UNIFIED VALIDATION using centralized service
    const validationIssues = validateBepData(projectData)
    
    console.log('[BEP-UNIFIED-COLLECTOR] Unified validation completed:', {
      totalIssues: validationIssues.length,
      errors: validationIssues.filter(i => i.severity === 'required').length,
      warnings: validationIssues.filter(i => i.severity === 'recommended' || i.severity === 'info').length,
      dataFields: Object.keys(projectData)
    })

    // Structure the complete export data
    const exportData: BEPExportData = {
      projectId: project.id,
      projectName: project.name || 'Untitled Project',
      clientName: project.client_name || '',
      location: project.location || '',
      projectType: project.project_type || '',
      status: project.status || 'draft',
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      ownerId: project.owner_id,
      
      // BEP sections - direct mapping from project_data
      projectOverview: projectData.project_overview || {},
      teamResponsibilities: projectData.team_responsibilities || {},
      softwareOverview: projectData.software_overview || {},
      modelingScope: projectData.modeling_scope || {},
      fileNaming: projectData.file_naming || {},
      collaborationCDE: projectData.collaboration_cde || {},
      geolocation: projectData.geolocation || {},
      modelChecking: projectData.model_checking || {},
      outputsDeliverables: projectData.outputs_deliverables || {},
      
      // Validation results from unified service
      validationIssues,
      
      // Metadata
      exportedAt: new Date().toISOString(),
      exportedBy: (await supabase.auth.getUser()).data.user?.id || 'unknown'
    }

    console.log('[BEP-UNIFIED-COLLECTOR] UNIFIED export data prepared:', {
      projectId,
      sectionsIncluded: [
        'projectOverview', 'teamResponsibilities', 'softwareOverview', 
        'modelingScope', 'fileNaming', 'collaborationCDE', 
        'geolocation', 'modelChecking', 'outputsDeliverables'
      ].filter(section => exportData[section] && Object.keys(exportData[section]).length > 0).length,
      hasValidationIssues: validationIssues.length > 0,
      timestamp: new Date().toISOString()
    })

    // Emit unified data event for all consumers
    bepDataEvents.emit('bep:data-updated', projectId, exportData)

    return exportData

  } catch (error) {
    console.error('[BEP-UNIFIED-COLLECTOR] Critical error in unified data collection:', error)
    
    // Provide detailed error info for debugging
    const errorDetails = {
      projectId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      source: 'UNIFIED_COLLECTOR'
    }
    
    console.error('[BEP-UNIFIED-COLLECTOR] Error details:', errorDetails)
    throw error
  }
}

/**
 * UNIFIED SAVE OPERATION - Ensures latest data is persisted
 */
export async function ensureLatestSave(projectId: string, currentData: Partial<ProjectData>): Promise<void> {
  console.log('[BEP-UNIFIED-SAVE] Starting unified save operation:', {
    projectId,
    dataSize: JSON.stringify(currentData).length,
    timestamp: new Date().toISOString()
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
      console.error('[BEP-UNIFIED-SAVE] Save failed:', error)
      throw new Error(`Failed to save: ${error.message}`)
    }

    console.log('[BEP-UNIFIED-SAVE] Save completed successfully:', {
      projectId,
      timestamp: new Date().toISOString()
    })

    // Emit data update event after successful save
    bepDataEvents.emit('bep:data-updated', projectId, currentData)
    
  } catch (error) {
    console.error('[BEP-UNIFIED-SAVE] Save operation failed:', error)
    throw error
  }
}