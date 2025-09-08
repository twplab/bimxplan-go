// @ts-nocheck
import { ProjectData, Firm, BIMTool } from "@/lib/supabase"

// Add enhanced severities and better organization
export type ValidationSeverity = 'required' | 'recommended' | 'info'

export interface ValidationRule {
  field: string
  section: string
  message: string
  severity: ValidationSeverity
  validator: (data: Partial<ProjectData>) => boolean
}

export interface ValidationReport {
  isValid: boolean
  hasErrors: boolean
  hasWarnings: boolean
  hasInfo: boolean
  issues: ValidationIssue[]
  completeness: number // 0-100 percentage
  sectionsValidated: string[]
}

export interface ValidationIssue {
  section: string
  field: string
  message: string
  severity: ValidationSeverity
}

// Field-to-validator mapping for dynamic field clearing
export const FIELD_VALIDATORS: Record<string, ValidationRule[]> = {}

/**
 * Comprehensive validation rules for BEP data with enhanced severities
 */
export const BEP_VALIDATION_RULES: ValidationRule[] = [
  // Project Overview - Required fields
  {
    field: 'project_name',
    section: 'Project Overview',
    message: 'Project name is required',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => !!data?.project_overview?.project_name?.trim()
  },
  {
    field: 'client_name', 
    section: 'Project Overview',
    message: 'Client name is required',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => !!data?.project_overview?.client_name?.trim()
  },
  {
    field: 'location',
    section: 'Project Overview', 
    message: 'Project location is required',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => !!data?.project_overview?.location?.trim()
  },
  {
    field: 'project_type',
    section: 'Project Overview',
    message: 'Project type is required', 
    severity: 'required',
    validator: (data: Partial<ProjectData>) => !!data?.project_overview?.project_type?.trim()
  },
  // Project Overview - Recommended
  {
    field: 'key_milestones',
    section: 'Project Overview',
    message: 'Key milestones should be defined for better project planning',
    severity: 'recommended',
    validator: (data: Partial<ProjectData>) => (data?.project_overview?.key_milestones?.length || 0) > 0
  },
  {
    field: 'description',
    section: 'Project Overview',
    message: 'Project description helps with context',
    severity: 'info',
    validator: (data: Partial<ProjectData>) => !!data?.project_overview?.description?.trim()
  },

  // Team & Responsibilities - Required
  {
    field: 'firms',
    section: 'Team & Responsibilities',
    message: 'At least one firm must be defined',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => (data?.team_responsibilities?.firms?.length || 0) > 0
  },
  
  // Software Overview - Required
  {
    field: 'main_tools',
    section: 'Software Overview', 
    message: 'At least one main BIM tool must be specified',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => (data?.software_overview?.main_tools?.length || 0) > 0
  },

  // Modeling Scope - Required
  {
    field: 'general_lod',
    section: 'Modeling Scope',
    message: 'General Level of Development (LOD) must be specified',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => !!data?.modeling_scope?.general_lod?.trim()
  },
  {
    field: 'units',
    section: 'Modeling Scope',
    message: 'Project units must be specified',
    severity: 'required', 
    validator: (data: Partial<ProjectData>) => !!data?.modeling_scope?.units?.trim()
  },

  // Collaboration & CDE - Required
  {
    field: 'platform',
    section: 'Collaboration & CDE',
    message: 'CDE platform must be specified',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => !!data?.collaboration_cde?.platform?.trim()
  },

  // Model Checking - Required
  {
    field: 'clash_detection_tools',
    section: 'Model Checking',
    message: 'At least one clash detection tool must be specified',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => (data?.model_checking?.clash_detection_tools?.length || 0) > 0
  },

  // File Naming - Recommended
  {
    field: 'use_conventions',
    section: 'File Naming',
    message: 'File naming conventions should be established for consistency',
    severity: 'recommended',
    validator: (data: Partial<ProjectData>) => data?.file_naming?.use_conventions === true || !!data?.file_naming?.prefix_format?.trim()
  },

  // Geolocation - Required for accurate coordination
  {
    field: 'is_georeferenced',
    section: 'Geolocation',
    message: 'Georeferencing status must be specified',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => data?.geolocation?.is_georeferenced !== undefined
  },
  {
    field: 'coordinate_system',
    section: 'Geolocation',
    message: 'Coordinate system should be specified if georeferenced',
    severity: 'required',
    validator: (data: Partial<ProjectData>) => {
      if (data?.geolocation?.is_georeferenced === true) {
        return !!data?.geolocation?.coordinate_system?.trim()
      }
      return true // Not required if not georeferenced
    }
  }
]

// Build field-to-validator mapping
BEP_VALIDATION_RULES.forEach(rule => {
  const key = `${rule.section}.${rule.field}`
  if (!FIELD_VALIDATORS[key]) {
    FIELD_VALIDATORS[key] = []
  }
  FIELD_VALIDATORS[key].push(rule)
})

/**
 * Get validators for a specific field to enable dynamic validation clearing
 */
export function getValidatorsForField(section: string, field: string): ValidationRule[] {
  const key = `${section}.${field}`
  return FIELD_VALIDATORS[key] || []
}

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

  const hasErrors = issues.some(issue => issue.severity === 'required')
  const hasWarnings = issues.some(issue => issue.severity === 'recommended') 
  const hasInfo = issues.some(issue => issue.severity === 'info')
  
  // Calculate completeness percentage based on REQUIRED fields only
  const totalRequiredFields = BEP_VALIDATION_RULES.filter(rule => rule.severity === 'required').length
  const completedRequiredFields = totalRequiredFields - issues.filter(issue => issue.severity === 'required').length
  const completeness = totalRequiredFields > 0 ? Math.round((completedRequiredFields / totalRequiredFields) * 100) : 100

  return {
    isValid: !hasErrors,
    hasErrors,
    hasWarnings,
    hasInfo,
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
        severity: 'required'
      })
    }
    if (!firm.discipline?.trim()) {
      issues.push({
        section: 'Team & Responsibilities', 
        field: `firms[${index}].discipline`,
        message: `Firm ${index + 1}: Discipline is required`,
        severity: 'required'
      })
    }
    if (!firm.bim_lead?.trim()) {
      issues.push({
        section: 'Team & Responsibilities',
        field: `firms[${index}].bim_lead`, 
        message: `Firm ${index + 1}: BIM Lead is required`,
        severity: 'required'
      })
    }
    if (!firm.contact_info?.trim()) {
      issues.push({
        section: 'Team & Responsibilities',
        field: `firms[${index}].contact_info`,
        message: `Firm ${index + 1}: Contact information is recommended`,
        severity: 'recommended'
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
        severity: 'required'
      })
    }
    if (!tool.version?.trim()) {
      issues.push({
        section: 'Software Overview',
        field: `main_tools[${index}].version`,
        message: `Tool ${index + 1}: Version is recommended for compatibility`,
        severity: 'recommended'
      })
    }
    if (!tool.discipline?.trim()) {
      issues.push({
        section: 'Software Overview',
        field: `main_tools[${index}].discipline`,
        message: `Tool ${index + 1}: Discipline assignment is recommended`,
        severity: 'recommended'
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
      severity: 'recommended'
    })
  }

  if (!modeling.discipline_lods || modeling.discipline_lods.length === 0) {
    issues.push({
      section: 'Modeling Scope',
      field: 'discipline_lods',
      message: 'Discipline-specific LODs are recommended for clarity',
      severity: 'recommended'
    })
  }
}

/**
 * Quick validation for step navigation - only checks REQUIRED fields
 */
export function validateStep(stepId: string, stepData: Record<string, unknown>): { isValid: boolean; issues: string[] } {
  const stepValidations: Record<string, (data: Record<string, unknown>) => string[]> = {
    overview: (data: Record<string, unknown>) => {
      const issues: string[] = []
      if (!data?.project_name?.trim()) issues.push('Project name is required')
      if (!data?.client_name?.trim()) issues.push('Client name is required')  
      if (!data?.location?.trim()) issues.push('Location is required')
      if (!data?.project_type?.trim()) issues.push('Project type is required')
      return issues
    },
    team: (data: Record<string, unknown>) => {
      const issues: string[] = []
      if (!data?.firms || data.firms.length === 0) {
        issues.push('At least one firm must be defined')
      } else {
        data.firms.forEach((firm: Firm, index: number) => {
          if (!firm.name?.trim()) issues.push(`Firm ${index + 1} name is required`)
          if (!firm.discipline?.trim()) issues.push(`Firm ${index + 1} discipline is required`)
          if (!firm.bim_lead?.trim()) issues.push(`Firm ${index + 1} BIM lead is required`)
        })
      }
      return issues
    },
    software: (data: Record<string, unknown>) => {
      const issues: string[] = []
      if (!data?.main_tools || data.main_tools.length === 0) {
        issues.push('At least one main BIM tool must be specified')
      } else {
        data.main_tools.forEach((tool: BIMTool, index: number) => {
          if (!tool.name?.trim()) issues.push(`Tool ${index + 1} name is required`)
        })
      }
      return issues
    },
    modeling: (data: Record<string, unknown>) => {
      const issues: string[] = []
      if (!data?.general_lod?.trim()) issues.push('General LOD is required')
      if (!data?.units?.trim()) issues.push('Units specification is required')
      return issues
    },
    collaboration: (data: Record<string, unknown>) => {
      const issues: string[] = []
      if (!data?.platform?.trim()) issues.push('CDE platform is required')
      return issues
    },
    checking: (data: Record<string, unknown>) => {
      const issues: string[] = []
      if (!data?.clash_detection_tools || data.clash_detection_tools.length === 0) {
        issues.push('At least one clash detection tool must be specified')
      }
      return issues
    },
    geolocation: (data: Record<string, unknown>) => {
      const issues: string[] = []
      if (data?.is_georeferenced === undefined) {
        issues.push('Georeferencing status must be specified')
      } else if (data.is_georeferenced === true && !data?.coordinate_system?.trim()) {
        issues.push('Coordinate system is required when georeferenced')
      }
      return issues
    },
    // Optional steps return no validation issues for navigation
    naming: () => [],
    outputs: () => []
  }

  const validator = stepValidations[stepId]
  if (!validator) return { isValid: true, issues: [] }

  const issues = validator(stepData)
  return { isValid: issues.length === 0, issues }
}

/**
 * Clear validation errors for a specific field
 */
export function clearFieldValidation(field: string, currentIssues: ValidationIssue[]): ValidationIssue[] {
  return currentIssues.filter(issue => issue.field !== field)
}