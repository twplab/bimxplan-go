import { ProjectData } from "@/lib/supabase"

export interface ValidationRule {
  field: string
  section: string
  message: string
  severity: 'error' | 'warning'
  validator: (data: any) => boolean
}

export interface ValidationReport {
  isValid: boolean
  hasErrors: boolean
  hasWarnings: boolean
  issues: ValidationIssue[]
  completeness: number // 0-100 percentage
  sectionsValidated: string[]
}

export interface ValidationIssue {
  section: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Comprehensive validation rules for BEP data
 */
export const BEP_VALIDATION_RULES: ValidationRule[] = [
  // Project Overview - Required fields
  {
    field: 'project_name',
    section: 'Project Overview',
    message: 'Project name is required',
    severity: 'error',
    validator: (data) => !!data?.project_overview?.project_name?.trim()
  },
  {
    field: 'client_name', 
    section: 'Project Overview',
    message: 'Client name is required',
    severity: 'error',
    validator: (data) => !!data?.project_overview?.client_name?.trim()
  },
  {
    field: 'location',
    section: 'Project Overview', 
    message: 'Project location is required',
    severity: 'error',
    validator: (data) => !!data?.project_overview?.location?.trim()
  },
  {
    field: 'project_type',
    section: 'Project Overview',
    message: 'Project type is required', 
    severity: 'error',
    validator: (data) => !!data?.project_overview?.project_type?.trim()
  },
  // Project Overview - Optional but recommended
  {
    field: 'key_milestones',
    section: 'Project Overview',
    message: 'Key milestones should be defined for better project planning',
    severity: 'warning',
    validator: (data) => data?.project_overview?.key_milestones?.length > 0
  },

  // Team & Responsibilities - Required
  {
    field: 'firms',
    section: 'Team & Responsibilities',
    message: 'At least one firm must be defined',
    severity: 'error',
    validator: (data) => data?.team_responsibilities?.firms?.length > 0
  },
  
  // Software Overview - Required
  {
    field: 'main_tools',
    section: 'Software Overview', 
    message: 'At least one main BIM tool must be specified',
    severity: 'error',
    validator: (data) => data?.software_overview?.main_tools?.length > 0
  },

  // Modeling Scope - Required
  {
    field: 'general_lod',
    section: 'Modeling Scope',
    message: 'General Level of Development (LOD) must be specified',
    severity: 'error',
    validator: (data) => !!data?.modeling_scope?.general_lod?.trim()
  },
  {
    field: 'units',
    section: 'Modeling Scope',
    message: 'Project units must be specified',
    severity: 'error', 
    validator: (data) => !!data?.modeling_scope?.units?.trim()
  },

  // Collaboration & CDE - Required
  {
    field: 'platform',
    section: 'Collaboration & CDE',
    message: 'CDE platform must be specified',
    severity: 'error',
    validator: (data) => !!data?.collaboration_cde?.platform?.trim()
  },

  // Model Checking - Required
  {
    field: 'clash_detection_tools',
    section: 'Model Checking',
    message: 'At least one clash detection tool must be specified',
    severity: 'error',
    validator: (data) => data?.model_checking?.clash_detection_tools?.length > 0
  },

  // File Naming - Warning for best practices
  {
    field: 'use_conventions',
    section: 'File Naming',
    message: 'File naming conventions should be established for consistency',
    severity: 'warning',
    validator: (data) => data?.file_naming?.use_conventions === true || !!data?.file_naming?.prefix_format?.trim()
  },

  // Geolocation - Warning
  {
    field: 'is_georeferenced',
    section: 'Geolocation',
    message: 'Consider specifying if the project requires georeferencing',
    severity: 'warning',
    validator: (data) => data?.geolocation?.is_georeferenced !== undefined
  }
]

/**
 * Validates project data against all rules
 */
export function validateProjectData(data: Partial<ProjectData>): ValidationReport {
  const issues: ValidationIssue[] = []
  const sectionsValidated = new Set<string>()

  // Apply all validation rules
  BEP_VALIDATION_RULES.forEach(rule => {
    sectionsValidated.add(rule.section)
    
    if (!rule.validator(data)) {
      issues.push({
        section: rule.section,
        field: rule.field,
        message: rule.message,
        severity: rule.severity
      })
    }
  })

  // Additional complex validations
  validateTeamFirms(data, issues)
  validateSoftwareTools(data, issues)
  validateModelingScope(data, issues)

  const hasErrors = issues.some(issue => issue.severity === 'error')
  const hasWarnings = issues.some(issue => issue.severity === 'warning')
  
  // Calculate completeness percentage
  const totalRequiredFields = BEP_VALIDATION_RULES.filter(rule => rule.severity === 'error').length
  const completedRequiredFields = totalRequiredFields - issues.filter(issue => issue.severity === 'error').length
  const completeness = totalRequiredFields > 0 ? Math.round((completedRequiredFields / totalRequiredFields) * 100) : 100

  return {
    isValid: !hasErrors,
    hasErrors,
    hasWarnings, 
    issues,
    completeness,
    sectionsValidated: Array.from(sectionsValidated)
  }
}

/**
 * Validate team firms in detail
 */
function validateTeamFirms(data: Partial<ProjectData>, issues: ValidationIssue[]) {
  const firms = data?.team_responsibilities?.firms
  if (!firms) return

  firms.forEach((firm, index) => {
    if (!firm.name?.trim()) {
      issues.push({
        section: 'Team & Responsibilities',
        field: `firms[${index}].name`,
        message: `Firm ${index + 1}: Name is required`,
        severity: 'error'
      })
    }
    if (!firm.discipline?.trim()) {
      issues.push({
        section: 'Team & Responsibilities', 
        field: `firms[${index}].discipline`,
        message: `Firm ${index + 1}: Discipline is required`,
        severity: 'error'
      })
    }
    if (!firm.bim_lead?.trim()) {
      issues.push({
        section: 'Team & Responsibilities',
        field: `firms[${index}].bim_lead`, 
        message: `Firm ${index + 1}: BIM Lead is required`,
        severity: 'error'
      })
    }
    if (!firm.contact_info?.trim()) {
      issues.push({
        section: 'Team & Responsibilities',
        field: `firms[${index}].contact_info`,
        message: `Firm ${index + 1}: Contact information is recommended`,
        severity: 'warning'
      })
    }
  })
}

/**
 * Validate software tools in detail
 */
function validateSoftwareTools(data: Partial<ProjectData>, issues: ValidationIssue[]) {
  const mainTools = data?.software_overview?.main_tools
  if (!mainTools) return

  mainTools.forEach((tool, index) => {
    if (!tool.name?.trim()) {
      issues.push({
        section: 'Software Overview',
        field: `main_tools[${index}].name`,
        message: `Tool ${index + 1}: Name is required`,
        severity: 'error'
      })
    }
    if (!tool.version?.trim()) {
      issues.push({
        section: 'Software Overview',
        field: `main_tools[${index}].version`,
        message: `Tool ${index + 1}: Version is recommended for compatibility`,
        severity: 'warning'
      })
    }
    if (!tool.discipline?.trim()) {
      issues.push({
        section: 'Software Overview',
        field: `main_tools[${index}].discipline`,
        message: `Tool ${index + 1}: Discipline assignment is recommended`,
        severity: 'warning'
      })
    }
  })
}

/**
 * Validate modeling scope in detail
 */
function validateModelingScope(data: Partial<ProjectData>, issues: ValidationIssue[]) {
  const modeling = data?.modeling_scope
  if (!modeling) return

  if (!modeling.levels_grids_strategy?.trim()) {
    issues.push({
      section: 'Modeling Scope',
      field: 'levels_grids_strategy',
      message: 'Levels and grids strategy is recommended',
      severity: 'warning'
    })
  }

  if (!modeling.discipline_lods || modeling.discipline_lods.length === 0) {
    issues.push({
      section: 'Modeling Scope',
      field: 'discipline_lods',
      message: 'Discipline-specific LODs are recommended for clarity',
      severity: 'warning'
    })
  }
}

/**
 * Quick validation for step navigation
 */
export function validateStep(stepId: string, stepData: any): { isValid: boolean; issues: string[] } {
  const stepValidations: Record<string, (data: any) => string[]> = {
    overview: (data) => {
      const issues: string[] = []
      if (!data?.project_name?.trim()) issues.push('Project name is required')
      if (!data?.client_name?.trim()) issues.push('Client name is required')  
      if (!data?.location?.trim()) issues.push('Location is required')
      if (!data?.project_type?.trim()) issues.push('Project type is required')
      return issues
    },
    team: (data) => {
      const issues: string[] = []
      if (!data?.firms || data.firms.length === 0) {
        issues.push('At least one firm must be defined')
      } else {
        data.firms.forEach((firm: any, index: number) => {
          if (!firm.name?.trim()) issues.push(`Firm ${index + 1} name is required`)
          if (!firm.discipline?.trim()) issues.push(`Firm ${index + 1} discipline is required`)
          if (!firm.bim_lead?.trim()) issues.push(`Firm ${index + 1} BIM lead is required`)
        })
      }
      return issues
    },
    software: (data) => {
      const issues: string[] = []
      if (!data?.main_tools || data.main_tools.length === 0) {
        issues.push('At least one main BIM tool must be specified')
      } else {
        data.main_tools.forEach((tool: any, index: number) => {
          if (!tool.name?.trim()) issues.push(`Tool ${index + 1} name is required`)
        })
      }
      return issues
    },
    modeling: (data) => {
      const issues: string[] = []
      if (!data?.general_lod?.trim()) issues.push('General LOD is required')
      if (!data?.units?.trim()) issues.push('Units specification is required')
      return issues
    },
    collaboration: (data) => {
      const issues: string[] = []
      if (!data?.platform?.trim()) issues.push('CDE platform is required')
      return issues
    },
    checking: (data) => {
      const issues: string[] = []
      if (!data?.clash_detection_tools || data.clash_detection_tools.length === 0) {
        issues.push('At least one clash detection tool must be specified')
      }
      return issues
    },
    // Optional steps return no validation issues
    naming: () => [],
    geolocation: () => [],
    outputs: () => []
  }

  const validator = stepValidations[stepId]
  if (!validator) return { isValid: true, issues: [] }

  const issues = validator(stepData)
  return { isValid: issues.length === 0, issues }
}