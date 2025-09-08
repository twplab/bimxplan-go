import { ProjectData } from "@/lib/supabase"
import { supabase } from "@/integrations/supabase/client"

/**
 * Creates a 100% complete sample BEP project for the current user
 */
const sampleProjectData: ProjectData = {
    project_overview: {
      project_name: "BIMxPlan Go – Sample Project (100% Complete)",
      client_name: "Demo Client Corporation",
      location: "123 Innovation Drive, Tech City, CA 90210",
      project_type: "Mixed-Use Development",
      key_milestones: [
        {
          name: "Design Development Complete",
          date: "2024-03-15",
          description: "All design elements finalized and approved"
        },
        {
          name: "Construction Documents",
          date: "2024-06-01", 
          description: "Complete CD set ready for permitting"
        },
        {
          name: "Construction Start",
          date: "2024-09-01",
          description: "Groundbreaking and construction commencement"
        }
      ]
    },
    team_responsibilities: {
      firms: [
        {
          name: "ABC Architecture",
          discipline: "Architecture",
          bim_lead: "Jane Smith, AIA",
          contact_info: "jane.smith@abcarch.com | (555) 123-4567"
        },
        {
          name: "DEF Structural Engineers",
          discipline: "Structural Engineering", 
          bim_lead: "John Doe, PE",
          contact_info: "john.doe@defstruct.com | (555) 234-5678"
        },
        {
          name: "GHI MEP Consultants",
          discipline: "MEP Engineering",
          bim_lead: "Sarah Johnson, PE",
          contact_info: "sarah.johnson@ghimep.com | (555) 345-6789"
        }
      ]
    },
    software_overview: {
      main_tools: [
        {
          name: "Autodesk Revit",
          version: "2025",
          discipline: "Architecture, Structure, MEP",
          usage: "Primary modeling platform for all disciplines"
        },
        {
          name: "Autodesk Navisworks Manage",
          version: "2025",
          discipline: "Coordination",
          usage: "Model coordination and clash detection"
        }
      ],
      team_specific_tools: [
        {
          name: "Autodesk AutoCAD",
          version: "2025",
          discipline: "Site/Civil",
          usage: "Site planning and civil drawings"
        },
        {
          name: "Bentley MicroStation",
          version: "10.16",
          discipline: "Infrastructure",
          usage: "Utility and infrastructure modeling"
        }
      ]
    },
    modeling_scope: {
      general_lod: "LOD 300",
      discipline_lods: [
        {
          discipline: "Architecture",
          lod_level: "LOD 350",
          description: "Detailed architectural elements for coordination"
        },
        {
          discipline: "Structure",
          lod_level: "LOD 300", 
          description: "Structural framing and major elements"
        },
        {
          discipline: "MEP",
          lod_level: "LOD 350",
          description: "Detailed MEP systems for coordination"
        }
      ],
      exceptions: [
        "Furniture and equipment modeled to LOD 200",
        "Landscape elements excluded from BIM model"
      ],
      units: "Imperial (feet and inches)",
      levels_grids_strategy: "Shared levels and grids managed by Architecture team. All disciplines to reference shared positioning system."
    },
    file_naming: {
      use_conventions: true,
      prefix_format: "[PROJECT_CODE]_[DISCIPLINE]_[BUILDING]_[LEVEL]_[TYPE]_[VERSION]",
      discipline_codes: "AR=Architecture, ST=Structural, ME=Mechanical, EL=Electrical, PL=Plumbing",
      versioning_format: "V[XX] for major versions, incremental letters (A,B,C) for minor revisions",
      examples: [
        "DEMO_AR_MAIN_L01_MODEL_V01.rvt",
        "DEMO_ST_MAIN_ALL_MODEL_V02A.rvt",
        "DEMO_ME_MAIN_MECH_MODEL_V01.rvt"
      ]
    },
    collaboration_cde: {
      platform: "Autodesk Construction Cloud (ACC)",
      file_linking_method: "Overlay linking with shared coordinates",
      sharing_frequency: "Weekly coordination uploads, daily working file sync",
      setup_responsibility: "Lead Architect (ABC Architecture)",
      access_controls: "Project-based permissions with discipline-specific folders"
    },
    geolocation: {
      is_georeferenced: true,
      coordinate_setup: "NAD83 State Plane California Zone 5",
      origin_location: "Southwest corner of site at property line intersection",
      coordinate_system: "US Survey Feet, State Plane California Zone 5 (EPSG:2229)"
    },
    model_checking: {
      clash_detection_tools: [
        "Autodesk Navisworks Manage",
        "Solibri Model Checker"
      ],
      coordination_process: "Weekly coordination meetings with clash detection reports distributed 48 hours prior",
      meeting_frequency: "Weekly Tuesdays 10:00 AM PT via Microsoft Teams",
      responsibility_matrix: "Architecture leads coordination, each discipline responsible for resolving discipline-specific clashes within 5 business days"
    },
    outputs_deliverables: {
      deliverables_by_phase: [
        {
          phase: "Schematic Design",
          deliverables: ["Conceptual models", "Design intent drawings"],
          formats: ["PDF", "RVT"],
          responsibility: "Architecture"
        },
        {
          phase: "Design Development", 
          deliverables: ["Coordinated discipline models", "Clash detection reports"],
          formats: ["RVT", "NWD", "PDF"],
          responsibility: "All disciplines"
        },
        {
          phase: "Construction Documents",
          deliverables: ["Final coordinated models", "Construction drawings", "IFC exports"],
          formats: ["RVT", "DWG", "PDF", "IFC"],
          responsibility: "All disciplines"
        }
      ],
      formats_standards: [
        "IFC 4.0 for model exchanges",
        "PDF/A for long-term archival",
        "Native formats (RVT) for active modeling"
      ],
      milestone_schedule: [
        {
          milestone: "SD Models Complete",
          deadline: "2024-01-15",
          deliverables: ["Architectural massing model", "Preliminary structural layout"]
        },
        {
          milestone: "DD Coordination Complete",
          deadline: "2024-03-15", 
          deliverables: ["Fully coordinated models", "Zero critical clashes"]
        },
        {
          milestone: "CD Final Models",
          deadline: "2024-06-01",
          deliverables: ["Construction-ready models", "Final drawing sets", "IFC deliverables"]
        }
      ]
    }
  }

export async function createSampleBEPProject(userId: string, mockMode: boolean = false): Promise<string | ProjectData> {
  // If mockMode is true, just return the sample data without database operations
  if (mockMode) {
    return sampleProjectData
  }

  // Verify authentication first
  const { data: authUser, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`)
  }
  
  if (!authUser.user || authUser.user.id !== userId) {
    throw new Error('Authentication mismatch - user ID does not match authenticated user')
  }

  // Insert the sample project
  console.log('Creating sample project for authenticated user:', authUser.user.id)
  console.log('Sample project data:', {
    name: sampleProjectData.project_overview.project_name,
    client_name: sampleProjectData.project_overview.client_name,
    location: sampleProjectData.project_overview.location,
    project_type: sampleProjectData.project_overview.project_type,
    status: 'completed',
    owner_id: authUser.user.id
  })
  
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: sampleProjectData.project_overview.project_name,
      client_name: sampleProjectData.project_overview.client_name,
      location: sampleProjectData.project_overview.location,
      project_type: sampleProjectData.project_overview.project_type,
      status: 'completed',
      owner_id: authUser.user.id,
      project_data: sampleProjectData
    })
    .select('id')
    .single()

  console.log('Sample project creation response:', { data: project, error })
  if (error) {
    throw new Error(`Failed to create sample project: ${error.message}`)
  }

  return project.id
}