import { ProjectData } from "@/lib/supabase"

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
 * Computes BEP completion progress based on minimal required fields per step
 */
export function computeBepProgress(projectData: Partial<ProjectData>): BEPProgress {
  const steps: StepProgress[] = [
    // Step 1: Project Overview
    {
      step: 1,
      stepId: 'overview',
      title: 'Project Overview',
      requiredFields: ['project_name', 'client_name'],
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 2: Team & Responsibilities  
    {
      step: 2,
      stepId: 'team',
      title: 'Team & Responsibilities',
      requiredFields: ['firms'],
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 3: Software Overview
    {
      step: 3,
      stepId: 'software', 
      title: 'Software Overview',
      requiredFields: ['main_tools'],
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 4: Modeling Scope
    {
      step: 4,
      stepId: 'modeling',
      title: 'Modeling Scope',
      requiredFields: ['general_lod', 'units'],
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 5: File Naming (optional)
    {
      step: 5,
      stepId: 'naming',
      title: 'File Naming',
      requiredFields: [],
      completedFields: [],
      complete: true, // Optional step
      percent: 100
    },
    // Step 6: Collaboration & CDE
    {
      step: 6,
      stepId: 'collaboration',
      title: 'Collaboration & CDE',
      requiredFields: ['platform'],
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 7: Geolocation
    {
      step: 7,
      stepId: 'geolocation',
      title: 'Geolocation',
      requiredFields: ['is_georeferenced', 'coordinate_system'],
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 8: Model Checking
    {
      step: 8,
      stepId: 'checking',
      title: 'Model Checking',
      requiredFields: ['clash_detection_tools'],
      completedFields: [],
      complete: false,
      percent: 0
    },
    // Step 9: Deliverables
    {
      step: 9,
      stepId: 'outputs',
      title: 'Outputs & Deliverables',
      requiredFields: ['deliverables_by_phase'],
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
 */
function isFieldComplete(sectionData: any, field: string, stepId: string): boolean {
  if (!sectionData) return false

  switch (field) {
    case 'project_name':
    case 'client_name':
    case 'general_lod':
    case 'units':
    case 'platform':
    case 'coordinate_system':
      return !!(sectionData[field]?.trim())
      
    case 'firms':
      return Array.isArray(sectionData.firms) && sectionData.firms.length > 0 &&
             sectionData.firms.some((firm: any) => firm.name?.trim() && firm.discipline?.trim() && firm.bim_lead?.trim())
             
    case 'main_tools':
      return Array.isArray(sectionData.main_tools) && sectionData.main_tools.length > 0 &&
             sectionData.main_tools.some((tool: any) => tool.name?.trim())
             
    case 'clash_detection_tools':
      return Array.isArray(sectionData.clash_detection_tools) && sectionData.clash_detection_tools.length > 0
      
    case 'is_georeferenced':
      return sectionData.is_georeferenced !== undefined && sectionData.is_georeferenced !== null && sectionData.coordinate_system?.trim()
      
    case 'deliverables_by_phase':
      return Array.isArray(sectionData.deliverables_by_phase) && sectionData.deliverables_by_phase.length > 0 &&
             sectionData.deliverables_by_phase.some((phase: any) => phase.phase?.trim() || phase.deliverables?.length > 0)
             
    default:
      return false
  }
}