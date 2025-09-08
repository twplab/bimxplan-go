export { supabase } from '@/integrations/supabase/client'

export type BIMProject = {
  id: string
  name: string
  location: string
  client_name: string
  project_type: string
  created_at: string
  updated_at: string
  owner_id: string
  team_members: TeamMember[]
  project_data: ProjectData
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  firm: string
  permissions: 'owner' | 'editor' | 'viewer'
}

export type ProjectData = {
  project_overview: ProjectOverview
  team_responsibilities: TeamResponsibilities
  software_overview: SoftwareOverview
  modeling_scope: ModelingScope
  file_naming: FileNaming
  collaboration_cde: CollaborationCDE
  geolocation: Geolocation
  model_checking: ModelChecking
  outputs_deliverables: OutputsDeliverables
}

export type ProjectOverview = {
  project_name: string
  location: string
  client_name: string
  project_type: string
  key_milestones: Milestone[]
}

export type Milestone = {
  name: string
  date: string
  description: string
}

export type TeamResponsibilities = {
  firms: Firm[]
}

export type Firm = {
  name: string
  discipline: string
  bim_lead: string
  contact_info: string
}

export type SoftwareOverview = {
  main_tools: BIMTool[]
  team_specific_tools: BIMTool[]
}

export type BIMTool = {
  name: string
  version: string
  discipline: string
  usage: string
}

export type ModelingScope = {
  general_lod: string
  discipline_lods: DisciplineLOD[]
  exceptions: string[]
  units: string
  levels_grids_strategy: string
}

export type DisciplineLOD = {
  discipline: string
  lod_level: string
  description: string
}

export type FileNaming = {
  use_conventions: boolean
  prefix_format: string
  discipline_codes: string
  versioning_format: string
  examples: string[]
}

export type CollaborationCDE = {
  platform: string
  file_linking_method: string
  sharing_frequency: string
  setup_responsibility: string
  access_controls: string
}

export type Geolocation = {
  is_georeferenced: boolean
  coordinate_setup: string
  origin_location: string
  coordinate_system: string
}

export type ModelChecking = {
  clash_detection_tools: string[]
  coordination_process: string
  meeting_frequency: string
  responsibility_matrix: string
}

export type OutputsDeliverables = {
  deliverables_by_phase: DeliverablePhase[]
  formats_standards: string[]
  milestone_schedule: MilestoneDeliverable[]
}

export type DeliverablePhase = {
  phase: string
  deliverables: string[]
  formats: string[]
  responsibility: string
}

export type MilestoneDeliverable = {
  milestone: string
  deadline: string
  deliverables: string[]
}