import { ProjectData, Firm, BIMTool, DeliverablePhase } from "@/lib/supabase"

export interface StepProgress {
  step: number
  stepId: string
  title: string
  complete: boolean
  percent: number
  requiredFields: string[]
  completedFields: string[]
}

export interface BEPProgress {
  perStep: StepProgress[]
  overallPercent: number
  completedSteps: number
  totalSteps: number
}

/**
 * Explicit required keys per step for accurate progress calculation
 */
const STEP_REQUIRED_KEYS: Record<string, string[]> = {
  overview: ['project_name', 'client_name', 'location', 'project_type'],
  team: ['firms'],
  software: ['main_tools'], 
  modeling: ['general_lod', 'units'],
  naming: [], // Optional step
  collaboration: ['platform'],
  geolocation: ['is_georeferenced', 'coordinate_system'], 
  checking: ['clash_detection_tools'],
  outputs: ['deliverables_by_phase']
}

/**
 * Computes BEP completion progress based on explicit required fields per step
 */
export function computeBepProgress(projectData: Partial<ProjectData>): BEPProgress {
  const startTime = performance.now()
  
  const steps: StepProgress[] = [
    // Step 1: Project Overview
    {
      step: 1,
      stepId: 'overview',
      title: 'Project Overview',
      requiredFields: STEP_REQUIRED_KEYS.overview,
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 2: Team & Responsibilities  
    {
      step: 2,
      stepId: 'team',
      title: 'Team & Responsibilities',
      requiredFields: STEP_REQUIRED_KEYS.team,
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 3: Software Overview
    {
      step: 3,
      stepId: 'software', 
      title: 'Software Overview',
      requiredFields: STEP_REQUIRED_KEYS.software,
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 4: Modeling Scope
    {
      step: 4,
      stepId: 'modeling',
      title: 'Modeling Scope',
      requiredFields: STEP_REQUIRED_KEYS.modeling,
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 5: File Naming (optional)
    {
      step: 5,
      stepId: 'naming',
      title: 'File Naming',
      requiredFields: STEP_REQUIRED_KEYS.naming,
      completedFields: [],
      complete: true, // Optional step
      percent: 100
    },
    // Step 6: Collaboration & CDE
    {
      step: 6,
      stepId: 'collaboration',
      title: 'Collaboration & CDE',
      requiredFields: STEP_REQUIRED_KEYS.collaboration,
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 7: Geolocation
    {
      step: 7,
      stepId: 'geolocation',
      title: 'Geolocation',
      requiredFields: STEP_REQUIRED_KEYS.geolocation,
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 8: Model Checking
    {
      step: 8,
      stepId: 'checking',
      title: 'Model Checking',
      requiredFields: STEP_REQUIRED_KEYS.checking,
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 9: Deliverables
    {
      step: 9,
      stepId: 'outputs',
      title: 'Outputs & Deliverables',
      requiredFields: STEP_REQUIRED_KEYS.outputs,
      completedFields: [],
      complete: false,
      percent: 0
    }
  ]

  // Evaluate each step
  steps.forEach(step => {
    if (step.requiredFields.length === 0) {
      // Optional step - already marked complete
      return
    }

    const sectionKey = getSectionKey(step.stepId)
    const sectionData = projectData[sectionKey as keyof ProjectData]
    
    step.requiredFields.forEach(field => {
      if (isFieldComplete(sectionData, field, step.stepId)) {
        step.completedFields.push(field)
      }
    })

    // Calculate step completion
    step.percent = step.requiredFields.length > 0 
      ? Math.round((step.completedFields.length / step.requiredFields.length) * 100)
      : 100
    
    step.complete = step.percent === 100
  })

  // Calculate overall progress
  const completedSteps = steps.filter(s => s.complete).length
  const totalSteps = steps.length
  const overallPercent = Math.round((completedSteps / totalSteps) * 100)

  const endTime = performance.now()
  const duration = endTime - startTime

  console.log('[BEP-PROGRESS-PERFORMANCE]', {
    duration: `${duration.toFixed(2)}ms`,
    completedSteps,
    totalSteps,
    overallPercent,
    target: '< 500ms'
  })

  console.log('[BEP-PROGRESS]', {
    completedSteps,
    totalSteps,
    overallPercent,
    stepBreakdown: steps.map(s => ({
      step: s.step,
      title: s.title,
      percent: s.percent,
      complete: s.complete,
      completedFields: s.completedFields.length,
      totalRequiredFields: s.requiredFields.length
    }))
  })

  return {
    perStep: steps,
    overallPercent,
    completedSteps,
    totalSteps
  }
}

/**
 * Maps step IDs to ProjectData section keys
 */
function getSectionKey(stepId: string): string {
  const mapping: Record<string, string> = {
    overview: 'project_overview',
    team: 'team_responsibilities', 
    software: 'software_overview',
    modeling: 'modeling_scope',
    naming: 'file_naming',
    collaboration: 'collaboration_cde',
    geolocation: 'geolocation',
    checking: 'model_checking',
    outputs: 'outputs_deliverables'
  }
  return mapping[stepId] || stepId
}

/**
 * Checks if a specific field is complete for a given step
 * Enhanced with better validation logic
 */
function isFieldComplete(sectionData: Record<string, unknown> | null | undefined, field: string, stepId: string): boolean {
  if (!sectionData) {
    return false
  }

  let result = false
  
  switch (field) {
    case 'project_name':
    case 'client_name':
    case 'location':
    case 'project_type':
    case 'general_lod':
    case 'units':
    case 'platform':
      result = !!(typeof sectionData[field] === 'string' && sectionData[field]?.trim())
      break
      
    case 'firms':
      result = Array.isArray(sectionData.firms) && sectionData.firms.length > 0 &&
               (sectionData.firms as Firm[]).some((firm: Firm) => 
                 firm.name?.trim() && firm.discipline?.trim() && firm.bim_lead?.trim()
               )
      break
              
    case 'main_tools':
      result = Array.isArray(sectionData.main_tools) && sectionData.main_tools.length > 0 &&
               (sectionData.main_tools as BIMTool[]).some((tool: BIMTool) => tool.name?.trim())
      break
              
    case 'clash_detection_tools':
      result = Array.isArray(sectionData.clash_detection_tools) && sectionData.clash_detection_tools.length > 0
      break
      
    case 'is_georeferenced':
      result = sectionData.is_georeferenced !== undefined && sectionData.is_georeferenced !== null
      break
      
    case 'coordinate_system':
      // Only required if is_georeferenced is true
      if (sectionData.is_georeferenced === true) {
        result = !!(typeof sectionData.coordinate_system === 'string' && sectionData.coordinate_system?.trim())
      } else {
        result = true // Not required if not georeferenced
      }
      break
      
    case 'deliverables_by_phase':
      result = Array.isArray(sectionData.deliverables_by_phase) && sectionData.deliverables_by_phase.length > 0 &&
               (sectionData.deliverables_by_phase as DeliverablePhase[]).some((phase: DeliverablePhase) => 
                 phase.phase?.trim() && Array.isArray(phase.deliverables) && phase.deliverables.length > 0
               )
      break
              
    default:
      console.warn(`[BEP-PROGRESS] Unknown field: ${field} in step: ${stepId}`)
      result = false
  }
  
  return result
}

/**
 * Get required fields for a specific step
 */
export function getStepRequiredFields(stepId: string): string[] {
  return STEP_REQUIRED_KEYS[stepId] || []
}