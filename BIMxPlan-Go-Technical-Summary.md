# BIMxPlan Go - Comprehensive Technical & Design Summary

*Migration & Rebuild Documentation*

---

## 1. App Overview

**App Name:** BIMxPlan Go

**Purpose:** A comprehensive web application for generating Building Information Modeling (BIM) Execution Plans. BIMxPlan Go streamlines the creation of professional BEP documents through a step-by-step wizard interface, live preview, and PDF export functionality.

**Target Users:**
- BIM Managers and Coordinators
- Architects and Engineering Firms  
- Construction Project Teams
- AEC Industry Professionals

**Core Functionality:**
- 10-step BEP creation wizard
- Real-time validation and progress tracking
- Live preview with immediate updates
- Professional PDF generation with branding
- Project collaboration and version control
- Sample project templates for quick starts

---

## 2. User Interface & Navigation

### 2.1 Screen/Page List

#### Core Navigation Pages
- **Index (`/`)** - Landing page with hero section and features
- **Dashboard (`/dashboard`)** - Project management hub
- **Authentication (`/auth`)** - Sign in/sign up with tabs
- **About (`/about`)** - Company information and features
- **Contact (`/contact`)** - Contact form and information
- **Terms (`/terms`)** - Terms of service and legal

#### BEP Workflow Pages
- **BEP Form (`/bep/:projectId`)** - Main 10-step wizard
  - **Step 1:** Project Overview
  - **Step 2:** Team & Responsibilities  
  - **Step 3:** Software Overview
  - **Step 4:** Modeling Scope & LOD
  - **Step 5:** File Naming Conventions
  - **Step 6:** Collaboration & CDE
  - **Step 7:** Geolocation & Coordinates
  - **Step 8:** Model Checking & Coordination
  - **Step 9:** Outputs & Deliverables
  - **Step 10:** Review & Export

#### Project Management
- **Project Editor (`/project/:projectId/edit`)** - Project details editing
- **Project Settings (`/project/:projectId/settings`)** - Configuration and access
- **Version History** - Project version tracking (component)

### 2.2 Navigation Flow

```mermaid
graph TD
    A[Landing Page] --> B[Dashboard]
    B --> C[Create New Project]
    B --> D[Open Existing Project]
    C --> E[BEP Step 1]
    D --> E
    E --> F[BEP Step 2-9]
    F --> G[BEP Step 10 - Review]
    G --> H[PDF Export]
    G --> I[Save & Continue Later]
    B --> J[Project Settings]
    B --> K[Version History]
```

### 2.3 Layout Details

#### Header/Navigation
- **Logo:** BIMxPlan logo (top-left)
- **Navigation Menu:** Dashboard, Projects, About, Contact
- **User Actions:** Theme toggle, user menu, sign out
- **Responsive:** Collapses to hamburger menu on mobile

#### BEP Wizard Layout
- **Left Sidebar:** Step navigation with progress pills
- **Main Content:** Form sections with validation
- **Right Panel:** Live preview (toggleable)
- **Footer:** Save status, navigation buttons

#### Dashboard Layout
- **Grid Layout:** 3-column responsive grid
- **Project Cards:** Name, client, progress, last modified
- **Action Buttons:** New Project, Sample Project
- **Filters:** Status, client, date range

### 2.4 Component Inventory by Screen

#### Dashboard Components
- **AppSidebar** - Project navigation
- **ProjectCard** - Individual project display
- **Button** - Various CTAs (New Project, Open, etc.)
- **Badge** - Status indicators
- **Progress** - Completion percentage
- **Dialog** - Confirmation modals

#### BEP Form Components
- **BEPFormWizard** - Main wizard container
- **StepNavigation** - Progress pills and navigation
- **FormSections** - Individual step forms:
  - ProjectOverviewForm
  - TeamResponsibilitiesForm  
  - SoftwareOverviewForm
  - ModelingScopeForm
  - FileNamingForm
  - CollaborationCDEForm
  - GeolocationForm
  - ModelCheckingForm
  - OutputsDeliverablesForm
- **Input** - Text inputs, textareas
- **Select** - Dropdown selections
- **Checkbox** - Boolean options
- **RadioGroup** - Single selection
- **Button** - Navigation and actions
- **Alert** - Validation messages
- **Card** - Section containers
- **ScrollArea** - Scrollable content
- **EnhancedBEPPreview** - Live preview panel

#### Shared UI Components (Shadcn-based)
- Form controls (Input, Select, Checkbox, etc.)
- Layout (Card, Container, Grid)
- Feedback (Alert, Toast, Badge)
- Navigation (Button, Tabs, Menu)
- Data display (Table, List, Progress)

### 2.5 Theme Settings

#### Color Palette (HSL Values)
```css
/* Light Theme */
--background: 0 0% 100%
--foreground: 240 10% 3.9%
--primary: 240 5.9% 10%
--primary-foreground: 0 0% 98%
--secondary: 240 4.8% 95.9%
--secondary-foreground: 240 5.9% 10%
--muted: 240 4.8% 95.9%
--muted-foreground: 240 3.8% 46.1%
--accent: 240 4.8% 95.9%
--accent-foreground: 240 5.9% 10%
--destructive: 0 84.2% 60.2%
--destructive-foreground: 0 0% 98%
--border: 240 5.9% 90%
--input: 240 5.9% 90%
--ring: 240 5.9% 10%

/* Dark Theme */
--background: 240 10% 3.9%
--foreground: 0 0% 98%
--primary: 0 0% 98%
--primary-foreground: 240 5.9% 10%
/* ... additional dark theme values */
```

#### Typography
- **Font Family:** Inter (primary), system fonts fallback
- **Font Sizes:** 
  - xs: 0.75rem (12px)
  - sm: 0.875rem (14px)  
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)
  - 3xl: 1.875rem (30px)

#### Spacing & Layout
- **Border Radius:** 
  - DEFAULT: 0.5rem
  - sm: 0.375rem
  - lg: 0.75rem
- **Shadows:**
  - sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
  - DEFAULT: 0 1px 3px 0 rgb(0 0 0 / 0.1)
  - lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)

### 2.6 Responsive Design

#### Breakpoints
- **sm:** 640px and up
- **md:** 768px and up  
- **lg:** 1024px and up
- **xl:** 1280px and up

#### Mobile Adaptations
- Sidebar collapses to drawer on mobile
- Form sections stack vertically
- Preview panel becomes modal overlay
- Touch-friendly button sizing (44px minimum)
- Optimized keyboard navigation

---

## 3. Logic & User Flows

### 3.1 BEP Creation Flow (Steps 1-10)

#### Step 1: Project Overview
**Data Collected:**
```typescript
{
  project_name: string (required)
  client_name: string (required)
  location: string (required)
  project_type: string (required)
  description?: string
  key_milestones?: Array<{
    name: string
    date: string
    description?: string
  }>
}
```

**Validation Rules:**
- Project name: Required, min 2 characters
- Client name: Required, min 2 characters
- Location: Required, min 2 characters
- Project type: Required selection from dropdown

**Navigation Logic:**
- Auto-save on field blur (500ms debounce)
- Next button enabled when required fields valid
- Progress calculation: 4 required fields = 10% completion

#### Step 2: Team & Responsibilities
**Data Collected:**
```typescript
{
  firms: Array<{
    name: string (required)
    discipline: string (required)
    bim_lead: string (required)
    contact_info?: string
    responsibilities?: string[]
  }>
}
```

**Validation Rules:**
- Minimum 1 firm required
- Each firm: name, discipline, BIM lead required
- Dynamic validation: errors clear as fields are filled

#### Step 3: Software Overview
**Data Collected:**
```typescript
{
  main_tools: Array<{
    name: string (required)
    version?: string
    discipline?: string
    purpose?: string
  }>
  team_specific_tools?: Array<{
    name: string
    version?: string
    discipline?: string
    team?: string
  }>
}
```

#### Step 4: Modeling Scope & LOD
**Data Collected:**
```typescript
{
  general_lod: string (required)
  units: string (required)
  levels_grids_strategy?: string
  discipline_lods?: Array<{
    discipline: string
    lod_level: string
    description?: string
  }>
}
```

#### Step 5: File Naming Conventions
**Data Collected:**
```typescript
{
  use_conventions?: boolean
  prefix_format?: string
  discipline_codes?: string
  versioning_format?: string
  examples?: string[]
}
```

#### Step 6: Collaboration & CDE
**Data Collected:**
```typescript
{
  platform: string (required)
  file_linking_method?: string
  sharing_frequency?: string
  setup_responsibility?: string
  access_permissions?: string
}
```

#### Step 7: Geolocation & Coordinates
**Data Collected:**
```typescript
{
  is_georeferenced: boolean (required)
  coordinate_system?: string (required if georeferenced)
  coordinate_setup?: string
  origin_location?: string
}
```

#### Step 8: Model Checking & Coordination
**Data Collected:**
```typescript
{
  clash_detection_tools: string[] (required, min 1)
  coordination_process?: string
  meeting_frequency?: string
  responsibility_matrix?: string
}
```

#### Step 9: Outputs & Deliverables
**Data Collected:**
```typescript
{
  deliverables_by_phase?: Array<{
    phase: string
    deliverables: string[]
    formats: string[]
    responsibility: string
  }>
}
```

#### Step 10: Review & Export
**Functionality:**
- Complete validation summary
- Live preview of full BEP
- PDF generation with validation bypass option
- Project save and version creation

### 3.2 State Management

#### Global State Variables
```typescript
// BEP Form Wizard State
const [currentStep, setCurrentStep] = useState(0)
const [projectData, setProjectData] = useState<Partial<ProjectData>>({})
const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([])
const [isLoading, setIsLoading] = useState(false)
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

// Progress Calculation
const [progressPercent, setProgressPercent] = useState(0)
const [sectionsCompleted, setSectionsCompleted] = useState<string[]>([])

// Preview State
const [previewData, setPreviewData] = useState<BEPExportData | null>(null)
const [showPreview, setShowPreview] = useState(false)
```

#### Data Flow Events
```typescript
// Event System
type BEPDataEventType = 'bep:data-updated' | 'bep:validation-updated' | 'bep:progress-updated'

// Data update triggers:
// 1. Form field changes (debounced 500ms)
// 2. Auto-save completion
// 3. Step navigation
// 4. External data refresh
```

### 3.3 Autosave & Rehydration Logic

#### Autosave Implementation
```typescript
// Debounced autosave (500ms)
const debouncedSave = useMemo(
  () => debounce(async (data: Partial<ProjectData>) => {
    setSaveStatus('saving')
    try {
      await supabase
        .from('projects')
        .update({ 
          project_data: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
      
      setSaveStatus('saved')
      // Show "Saved 2 seconds ago" indicator
      setLastSaved(new Date())
      
      // Emit data update event
      bepDataEvents.emit('bep:data-updated', projectId, data)
    } catch (error) {
      setSaveStatus('error')
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }, 500),
  [projectId]
)
```

#### Form Rehydration
```typescript
// On component mount
useEffect(() => {
  if (projectId) {
    getBepExportData(projectId)
      .then(exportData => {
        // Rehydrate all form fields
        setProjectData(exportData)
        setCurrentStep(calculateLastCompletedStep(exportData))
      })
      .catch(error => {
        toast({
          title: "Load Failed", 
          description: error.message,
          variant: "destructive"
        })
      })
  }
}, [projectId])
```

### 3.4 Validation Logic

#### Real-time Validation
```typescript
// Field-level validation (immediate)
const validateField = (section: string, field: string, value: any) => {
  const validators = getValidatorsForField(section, field)
  const errors = validators.filter(rule => !rule.validator({ [section]: { [field]: value } }))
  
  // Clear existing errors for this field
  setValidationErrors(prev => 
    prev.filter(err => !(err.section === section && err.field === field))
  )
  
  // Add new errors
  if (errors.length > 0) {
    setValidationErrors(prev => [...prev, ...errors.map(rule => ({
      section: rule.section,
      field: rule.field,
      message: rule.message,
      severity: rule.severity
    }))])
  }
}

// Step validation (on navigation)
const validateStep = (stepId: string, stepData: any) => {
  const { isValid, issues } = validateStep(stepId, stepData)
  return { isValid, issues }
}
```

#### Validation Severities
```typescript
type ValidationSeverity = 'required' | 'recommended' | 'info'

// Severity handling:
// - 'required': Blocks progress, shows red alerts
// - 'recommended': Shows yellow warnings, allows progress  
// - 'info': Shows blue info messages, cosmetic only
```

### 3.5 PDF Generation Logic

#### Complete PDF Workflow
```typescript
const generatePDF = async () => {
  // Step 1: Validation gate with bypass option
  const criticalErrors = validationErrors.filter(e => e.severity === 'required')
  if (criticalErrors.length > 0) {
    const shouldProceed = window.confirm(
      `${criticalErrors.length} required field(s) are missing. Generate PDF anyway?`
    )
    if (!shouldProceed) return
  }
  
  // Step 2: Ensure latest data save
  await ensureLatestSave(projectId, projectData)
  
  // Step 3: Fetch fresh unified data
  const exportData = await getBepExportData(projectId)
  
  // Step 4: Map to clean PDF model
  const pdfModel = mapProjectDataToPdfModel(exportData)
  
  // Step 5: Render PDF with logo/footer
  const pdf = await renderPdfFromModel(pdfModel, projectId)
  
  // Step 6: Download and create version
  const filename = generatePdfFilename(pdfModel.header.projectName)
  pdf.save(filename)
  await createVersionEntry(projectId, exportData, filename)
}
```

### 3.6 Progress Calculation

#### Explicit Required Keys per Step
```typescript
const REQUIRED_FIELDS_BY_STEP = {
  'overview': ['project_name', 'client_name', 'location', 'project_type'],
  'team': ['firms[].name', 'firms[].discipline', 'firms[].bim_lead'],
  'software': ['main_tools[].name'],
  'modeling': ['general_lod', 'units'],
  'collaboration': ['platform'],
  'checking': ['clash_detection_tools'],
  'geolocation': ['is_georeferenced'],
  // Optional steps have no required fields
  'naming': [],
  'outputs': []
}

const computeBepProgress = (data: Partial<ProjectData>): number => {
  const totalRequired = Object.values(REQUIRED_FIELDS_BY_STEP).flat().length
  let completed = 0
  
  // Count completed required fields
  Object.entries(REQUIRED_FIELDS_BY_STEP).forEach(([step, fields]) => {
    fields.forEach(fieldPath => {
      if (getValueByPath(data, fieldPath)) {
        completed++
      }
    })
  })
  
  return Math.round((completed / totalRequired) * 100)
}
```

### 3.7 Chatbot Behavior (BIM Manager Tsoi)

#### Positioning & Interaction
```typescript
const ChatBot = () => {
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  // Hide on auth and BEP pages
  const shouldHide = ['/auth', '/bep/'].some(path => location.pathname.includes(path))
  
  // Return to default position after 10s inactivity
  useEffect(() => {
    if (!isDragging) {
      const timer = setTimeout(() => {
        setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [isDragging, position])
  
  // Double-click to close
  const handleDoubleClick = () => setIsVisible(false)
  
  // Drag functionality with boundaries
  const handleDrag = (e: DragEvent) => {
    const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY))
    setPosition({ x: newX, y: newY })
  }
}
```

#### Chat Functionality
- **Purpose:** BIM guidance and help
- **Triggers:** Welcome message, help requests
- **Content:** BEP best practices, software tips
- **Integration:** Context-aware based on current step

---

## 4. Data Models / Schema

### 4.1 Supabase Tables

#### 4.1.1 profiles
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text,
  email text,
  company text,
  role text DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- Users can view their own profile
- Users can update their own profile  
- Users can insert their own profile

#### 4.1.2 projects
```sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  client_name text,
  location text,
  project_type text,
  status text DEFAULT 'draft',
  project_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Project Data Structure:**
```typescript
interface ProjectData {
  project_overview?: {
    project_name: string
    client_name: string
    location: string
    project_type: string
    description?: string
    key_milestones?: Array<{
      name: string
      date: string
      description?: string
    }>
  }
  team_responsibilities?: {
    firms: Array<{
      name: string
      discipline: string
      bim_lead: string
      contact_info?: string
      responsibilities?: string[]
    }>
  }
  software_overview?: {
    main_tools: Array<{
      name: string
      version?: string
      discipline?: string
      purpose?: string
    }>
    team_specific_tools?: Array<{
      name: string
      version?: string
      discipline?: string
      team?: string
    }>
  }
  modeling_scope?: {
    general_lod: string
    units: string
    levels_grids_strategy?: string
    discipline_lods?: Array<{
      discipline: string
      lod_level: string
      description?: string
    }>
  }
  file_naming?: {
    use_conventions?: boolean
    prefix_format?: string
    discipline_codes?: string
    versioning_format?: string
    examples?: string[]
  }
  collaboration_cde?: {
    platform: string
    file_linking_method?: string
    sharing_frequency?: string
    setup_responsibility?: string
    access_permissions?: string
  }
  geolocation?: {
    is_georeferenced: boolean
    coordinate_system?: string
    coordinate_setup?: string
    origin_location?: string
  }
  model_checking?: {
    clash_detection_tools: string[]
    coordination_process?: string
    meeting_frequency?: string
    responsibility_matrix?: string
  }
  outputs_deliverables?: {
    deliverables_by_phase?: Array<{
      phase: string
      deliverables: string[]
      formats: string[]
      responsibility: string
    }>
  }
}
```

**RLS Policies:**
- Users can view accessible projects (via user_can_access_project function)
- Users can create their own projects
- Users can update their own projects or collaborated projects with editor role
- Users can delete their own projects

#### 4.1.3 project_collaborators
```sql
CREATE TABLE public.project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
```

**Roles:**
- `owner`: Full access (inherited from project owner)
- `editor`: Can edit project data
- `viewer`: Read-only access

**RLS Policies:**
- Users can view collaborators of accessible projects
- Project owners can invite collaborators
- Project owners can remove collaborators
- Users can update their own collaboration status

#### 4.1.4 project_versions
```sql
CREATE TABLE public.project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  version_number integer NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  changelog text,
  project_data jsonb NOT NULL
);
```

**Purpose:** Version control for project snapshots and PDF exports

**RLS Policies:**
- Users can view versions of accessible projects
- Users can create versions for editable projects

### 4.2 Database Functions

#### 4.2.1 user_can_access_project
```sql
CREATE OR REPLACE FUNCTION public.user_can_access_project(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_uuid 
    AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid 
    AND user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  );
$$;
```

#### 4.2.2 handle_new_user
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;
```

#### 4.2.3 update_updated_at_column
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 4.3 CRUD Operations

#### Project Creation
```typescript
const createProject = async (projectData: Partial<ProjectData>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      name: projectData.project_overview?.project_name || 'Untitled Project',
      client_name: projectData.project_overview?.client_name,
      location: projectData.project_overview?.location,
      project_type: projectData.project_overview?.project_type,
      project_data: projectData,
      status: 'draft'
    })
    .select()
    .single()
  
  return { data, error }
}
```

#### Project Updates
```typescript
const updateProject = async (projectId: string, updates: Partial<ProjectData>) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      project_data: updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .select()
    .single()
  
  return { data, error }
}
```

#### Collaboration Management
```typescript
const inviteCollaborator = async (projectId: string, email: string, role: string) => {
  // Step 1: Find user by email
  const { data: userData } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .single()
  
  if (!userData) throw new Error('User not found')
  
  // Step 2: Create collaboration invitation
  const { data, error } = await supabase
    .from('project_collaborators')
    .insert({
      project_id: projectId,
      user_id: userData.user_id,
      invited_by: user.id,
      role
    })
  
  return { data, error }
}
```

---

## 5. API Integrations

### 5.1 Supabase Integration

#### Configuration
```typescript
// Client setup
const supabaseUrl = 'https://fcohkllemgyyhljoqrxe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

#### Authentication APIs
```typescript
// Sign Up
const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  })
  return { data, error }
}

// Sign In  
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

// Sign Out
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
```

#### Data APIs

**Projects API:**
```typescript
// GET /projects - List user's accessible projects
const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_collaborators!inner(
        role,
        accepted_at
      )
    `)
    .order('updated_at', { ascending: false })
  
  return { data, error }
}

// GET /projects/:id - Get single project
const getProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  
  return { data, error }
}

// POST /projects - Create new project
const createProject = async (projectData: any) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single()
  
  return { data, error }
}

// PATCH /projects/:id - Update project
const updateProject = async (projectId: string, updates: any) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()
  
  return { data, error }
}

// DELETE /projects/:id - Delete project
const deleteProject = async (projectId: string) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  
  return { error }
}
```

**RPC Calls:**
```typescript
// Check project access
const checkAccess = async (projectId: string) => {
  const { data, error } = await supabase.rpc('user_can_access_project', {
    project_uuid: projectId
  })
  return { data, error }
}
```

### 5.2 PDF Generation Service

#### Client-side PDF Generation using jsPDF
```typescript
import jsPDF from 'jspdf'

const generatePDF = async (pdfModel: PdfModel, projectId: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  // Page setup
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  
  // Header with logo
  pdf.addImage(logoBase64, 'PNG', margin, margin, 40, 15)
  pdf.setFontSize(20)
  pdf.text('BIM Execution Plan', margin, margin + 25)
  
  // Content sections
  let yPosition = margin + 40
  
  Object.entries(pdfModel.sections).forEach(([sectionKey, section]) => {
    // Section header
    pdf.setFontSize(16)
    pdf.text(section.title, margin, yPosition)
    yPosition += 10
    
    // Section content
    pdf.setFontSize(12)
    section.content.forEach(item => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = margin
      }
      
      pdf.text(item.label + ': ' + item.value, margin, yPosition)
      yPosition += 6
    })
    
    yPosition += 10
  })
  
  // Footer on each page
  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.text(
      `Generated by BIMxPlan Go | Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 10
    )
  }
  
  return pdf
}
```

#### PDF Model Mapping
```typescript
interface PdfModel {
  header: {
    projectName: string
    clientName: string
    generatedDate: string
    version: string
  }
  sections: {
    [key: string]: {
      title: string
      content: Array<{
        label: string
        value: string
        type: 'text' | 'list' | 'table'
      }>
    }
  }
  footer: {
    logoBase64: string
    generatedBy: string
    timestamp: string
  }
}

const mapProjectDataToPdfModel = (exportData: BEPExportData): PdfModel => {
  return {
    header: {
      projectName: exportData.projectName,
      clientName: exportData.clientName,
      generatedDate: new Date().toLocaleDateString(),
      version: '1.0'
    },
    sections: {
      overview: {
        title: '1. Project Overview',
        content: [
          { label: 'Project Name', value: exportData.projectOverview?.project_name || '—', type: 'text' },
          { label: 'Client', value: exportData.projectOverview?.client_name || '—', type: 'text' },
          { label: 'Location', value: exportData.projectOverview?.location || '—', type: 'text' },
          { label: 'Type', value: exportData.projectOverview?.project_type || '—', type: 'text' }
        ]
      },
      // ... other sections
    },
    footer: {
      logoBase64: LOGO_BASE64,
      generatedBy: 'BIMxPlan Go',
      timestamp: new Date().toISOString()
    }
  }
}
```

---

## 6. Authentication & User Roles

### 6.1 Authentication Method

**Provider:** Supabase Auth (Email/Password)

**Flow:**
1. User registers with email/password + display name
2. Email verification sent (optional based on settings)
3. Profile automatically created via trigger
4. JWT token stored in browser storage
5. Auto-refresh token handling

### 6.2 Access Control Rules

#### Row Level Security (RLS) Policies

**Projects Table:**
```sql
-- Users can view accessible projects
CREATE POLICY "Users can view accessible projects" 
ON public.projects FOR SELECT 
USING (user_can_access_project(id));

-- Users can create their own projects
CREATE POLICY "Users can create their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Users can update their own projects or collaborated projects with editor role
CREATE POLICY "Users can update their own projects or collaborated projects" 
ON public.projects FOR UPDATE 
USING (
  (auth.uid() = owner_id) OR 
  (EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_id = projects.id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'editor') 
    AND accepted_at IS NOT NULL
  ))
);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = owner_id);
```

**Project Collaborators Table:**
```sql
-- Users can view collaborators of accessible projects
CREATE POLICY "Users can view collaborators of accessible projects" 
ON public.project_collaborators FOR SELECT 
USING (user_can_access_project(project_id));

-- Project owners can invite collaborators
CREATE POLICY "Project owners can invite collaborators" 
ON public.project_collaborators FOR INSERT 
WITH CHECK (
  (auth.uid() = invited_by) AND 
  (EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_collaborators.project_id 
    AND owner_id = auth.uid()
  ))
);

-- Users can update their own collaboration status
CREATE POLICY "Users can update their own collaboration status" 
ON public.project_collaborators FOR UPDATE 
USING (auth.uid() = user_id);
```

### 6.3 Role-based Permissions

#### Project Roles
```typescript
type ProjectRole = 'owner' | 'editor' | 'viewer'

const ROLE_PERMISSIONS = {
  owner: {
    canRead: true,
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canExport: true,
    canManageSettings: true
  },
  editor: {
    canRead: true,
    canEdit: true,
    canDelete: false,
    canInvite: false,
    canExport: true,
    canManageSettings: false
  },
  viewer: {
    canRead: true,
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canExport: true,
    canManageSettings: false
  }
}
```

#### Permission Checking
```typescript
const hasPermission = async (projectId: string, action: string) => {
  // Get user's role for the project
  const { data: collaboration } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('accepted_at', 'not.is.null')
    .single()
  
  // Check if user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()
  
  const role = project?.owner_id === user.id ? 'owner' : collaboration?.role
  
  return ROLE_PERMISSIONS[role]?.[action] || false
}
```

### 6.4 user_can_access_project Function

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.user_can_access_project(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    -- User is the project owner
    SELECT 1 FROM public.projects 
    WHERE id = project_uuid 
    AND owner_id = auth.uid()
  ) OR EXISTS (
    -- User is an accepted collaborator
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid 
    AND user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  );
$function$
```

**Usage in Application:**
```typescript
// Before any project operation, check access
const verifyAccess = async (projectId: string) => {
  const { data: hasAccess, error } = await supabase.rpc('user_can_access_project', {
    project_uuid: projectId
  })
  
  if (error || !hasAccess) {
    throw new Error('Access denied to this project')
  }
  
  return true
}
```

---

## 7. App Settings & Environment

### 7.1 Environment Configuration

#### Supabase Configuration
```typescript
// Environment variables (embedded in build)
const SUPABASE_URL = 'https://fcohkllemgyyhljoqrxe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb2hrbGxlbWd5eWhsam9xcnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjEyNTgsImV4cCI6MjA3MDEzNzI1OH0.eeMTIcbjkFB291TrYz-XiCKwZZTyhXFGAA3k_PDJhNM'

// Note: These are public-safe keys for client-side use
// Actual database security is handled by RLS policies
```

#### Build Configuration (Vite)
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-button', '@radix-ui/react-dialog'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
```

### 7.2 Application Configuration

#### Theme Configuration
```typescript
// tailwind.config.ts
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### Routing Configuration
```typescript
// src/main.tsx - React Router setup
const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/bep/:projectId",
    element: <BEPForm />,
  },
  {
    path: "/project/:projectId/edit",
    element: <ProjectEditor />,
  },
  {
    path: "/project/:projectId/settings",
    element: <ProjectSettings />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
```

### 7.3 Feature Flags & Toggles

#### Development vs Production
```typescript
const IS_DEVELOPMENT = import.meta.env.DEV
const IS_PRODUCTION = import.meta.env.PROD

// Feature toggles
const FEATURES = {
  CHATBOT_ENABLED: true,
  ADVANCED_VALIDATION: true,
  COLLABORATION_FEATURES: true,
  PDF_GENERATION: true,
  SAMPLE_PROJECTS: true,
  DIAGNOSTICS_PANEL: IS_DEVELOPMENT, // Only in dev
  DEBUG_LOGGING: IS_DEVELOPMENT,
}
```

#### Performance Settings
```typescript
const PERFORMANCE_CONFIG = {
  AUTOSAVE_DEBOUNCE_MS: 500,
  VALIDATION_DEBOUNCE_MS: 300,
  PREVIEW_UPDATE_DELAY_MS: 200,
  MAX_RETRY_ATTEMPTS: 3,
  PDF_GENERATION_TIMEOUT_MS: 30000,
  FILE_UPLOAD_MAX_SIZE_MB: 50,
}
```

---

## 8. Assets & Files

### 8.1 Image Assets

#### BIMxPlan Logo
- **Location:** `src/assets/bimxplan-logo.png`
- **Usage:** Header navigation, PDF headers, footer branding
- **Format:** PNG with transparency
- **Dimensions:** 200x75px (approx)
- **Base64 Embedded:** Available for PDF generation

#### BIM Manager Tsoi (Chatbot Avatar)
- **Location:** `public/lovable-uploads/` (various files)
- **Usage:** Chatbot interface, help sections
- **Format:** PNG with transparency
- **Dimensions:** 64x64px
- **Fallback:** Generic avatar icon if image fails

#### UI Icons
- **Source:** Lucide React icon library
- **Icons Used:**
  - Building (Project Overview)
  - Users (Team & Responsibilities)
  - Settings (Software Overview)
  - Layers (Modeling Scope)
  - FileText (File Naming, Documents)
  - Globe (Collaboration & CDE)
  - MapPin (Geolocation)
  - CheckCircle (Model Checking)
  - FileArchive (Outputs & Deliverables)
  - Download (PDF Export)
  - Eye (Preview)
  - RotateCw (Refresh)
  - AlertCircle (Validation)

### 8.2 Font Files

#### Primary Font: Inter
- **Source:** Google Fonts / system fonts
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Fallback:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

#### PDF Font Handling
```typescript
// jsPDF built-in fonts
const PDF_FONTS = {
  regular: 'helvetica',
  bold: 'helvetica-bold',
  italic: 'helvetica-oblique'
}
```

### 8.3 Asset Loading Strategy

#### Logo Base64 Encoding for PDF
```typescript
// Convert logo to base64 for embedded PDF use
const convertLogoToBase64 = async (): Promise<string> => {
  try {
    const response = await fetch(logoUrl)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Logo loading failed, using fallback')
    return FALLBACK_LOGO_BASE64
  }
}
```

#### Image Optimization
- **Format:** WebP with PNG fallback
- **Lazy Loading:** Implemented for chatbot avatar
- **Compression:** Optimized for web delivery
- **CDN:** Assets served from Lovable infrastructure

---

## 9. Dependencies & Limitations

### 9.1 Core Dependencies

#### React & Build Tools
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "vite": "^5.0.0",
  "@vitejs/plugin-react": "^4.0.0",
  "typescript": "^5.0.0"
}
```

#### UI Framework
```json
{
  "@radix-ui/react-*": "Latest versions",
  "tailwindcss": "^3.4.0",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "lucide-react": "^0.462.0"
}
```

#### Backend & Data
```json
{
  "@supabase/supabase-js": "^2.53.1",
  "@tanstack/react-query": "^5.83.0"
}
```

#### Forms & Validation
```json
{
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0",
  "zod": "^3.25.76"
}
```

#### PDF Generation
```json
{
  "jspdf": "^3.0.1",
  "html2canvas": "^1.4.1"
}
```

#### Utilities
```json
{
  "date-fns": "^3.6.0",
  "next-themes": "^0.4.6",
  "sonner": "^1.7.4"
}
```

### 9.2 Platform-Specific Dependencies

#### Lovable Platform Features
- **Deployment:** Automatic build and deployment
- **Environment:** Managed hosting with CDN
- **Database:** Supabase integration pre-configured
- **Auth:** Supabase Auth with RLS policies
- **File Storage:** Public asset hosting

#### Lovable Limitations
- **No Backend Code:** Cannot run custom server-side logic
- **No Environment Variables:** Secrets must be embedded or use Supabase
- **No File System Access:** Assets must be publicly accessible
- **Build Size Limits:** Standard Vite build constraints

### 9.3 Current Known Issues

#### Validation System
- ✅ **RESOLVED:** Validation severity types unified to 'required' | 'recommended' | 'info'
- ⚠️ **Minor:** Some validation messages could be more descriptive
- ⚠️ **Enhancement:** Field-specific validation clearing could be more granular

#### Performance
- ⚠️ **Minor:** Large project data (>100KB) may cause slight delays in autosave
- ⚠️ **Enhancement:** PDF generation for very large projects (>50 sections) takes >4s

#### Mobile Experience
- ✅ **Working:** Responsive design implemented
- ⚠️ **Enhancement:** Chatbot positioning on iOS Safari needs refinement
- ⚠️ **Minor:** Some form inputs could have better touch targets

#### Browser Compatibility
- ✅ **Chrome/Edge:** Fully supported
- ✅ **Firefox:** Fully supported  
- ✅ **Safari:** Fully supported
- ⚠️ **IE11:** Not supported (modern JS features used)

### 9.4 Migration Considerations

#### Data Export
- All project data stored in standardized JSON format
- Easy export via Supabase database backup
- Version history preserved in project_versions table

#### Code Portability
- Standard React + TypeScript codebase
- Minimal platform-specific code (only Supabase integration)
- UI components are framework-agnostic (could port to Vue, Angular)

#### Assets Migration
- Images can be downloaded from public URLs
- Logo embedded as base64 for offline use
- No external CDN dependencies beyond fonts

---

## 10. Exact Conditional Logic & Complex Interactions

### 10.1 Validation Logic Details

#### Step-by-Step Validation Expressions
```typescript
// Project Overview validation
const validateProjectOverview = (data: any) => {
  const errors = []
  
  if (!data?.project_name?.trim()) {
    errors.push({ field: 'project_name', message: 'Project name is required', severity: 'required' })
  }
  
  if (!data?.client_name?.trim()) {
    errors.push({ field: 'client_name', message: 'Client name is required', severity: 'required' })
  }
  
  if (!data?.location?.trim()) {
    errors.push({ field: 'location', message: 'Project location is required', severity: 'required' })
  }
  
  if (!data?.project_type?.trim()) {
    errors.push({ field: 'project_type', message: 'Project type is required', severity: 'required' })
  }
  
  // Recommended fields
  if (!data?.key_milestones || data.key_milestones.length === 0) {
    errors.push({ field: 'key_milestones', message: 'Key milestones should be defined for better project planning', severity: 'recommended' })
  }
  
  return errors
}

// Team validation with dynamic array validation
const validateTeamResponsibilities = (data: any) => {
  const errors = []
  
  if (!data?.firms || data.firms.length === 0) {
    errors.push({ field: 'firms', message: 'At least one firm must be defined', severity: 'required' })
    return errors
  }
  
  data.firms.forEach((firm: any, index: number) => {
    if (!firm.name?.trim()) {
      errors.push({ field: `firms[${index}].name`, message: `Firm ${index + 1}: Name is required`, severity: 'required' })
    }
    if (!firm.discipline?.trim()) {
      errors.push({ field: `firms[${index}].discipline`, message: `Firm ${index + 1}: Discipline is required`, severity: 'required' })
    }
    if (!firm.bim_lead?.trim()) {
      errors.push({ field: `firms[${index}].bim_lead`, message: `Firm ${index + 1}: BIM Lead is required`, severity: 'required' })
    }
    if (!firm.contact_info?.trim()) {
      errors.push({ field: `firms[${index}].contact_info`, message: `Firm ${index + 1}: Contact information is recommended`, severity: 'recommended' })
    }
  })
  
  return errors
}
```

#### Button Enable/Disable Logic
```typescript
// Next/Previous button states
const getNavigationButtonStates = (currentStep: number, projectData: any, validationErrors: ValidationIssue[]) => {
  const currentStepId = STEP_IDS[currentStep]
  const currentStepData = getStepData(projectData, currentStepId)
  
  // Get required errors for current step only
  const currentStepErrors = validationErrors.filter(error => 
    error.section === STEP_SECTIONS[currentStepId] && 
    error.severity === 'required'
  )
  
  return {
    canGoNext: currentStepErrors.length === 0,
    canGoPrevious: currentStep > 0,
    showValidationWarning: currentStepErrors.length > 0,
    nextButtonText: currentStep === STEP_IDS.length - 1 ? 'Review & Export' : 'Next Step',
    nextButtonVariant: currentStepErrors.length > 0 ? 'outline' : 'default'
  }
}

// PDF generation button logic
const getPDFButtonState = (validationErrors: ValidationIssue[], isExporting: boolean, hasAccess: boolean) => {
  const criticalErrors = validationErrors.filter(error => error.severity === 'required')
  
  return {
    disabled: isExporting || !hasAccess,
    variant: criticalErrors.length > 0 ? 'outline' : 'default',
    text: isExporting 
      ? 'Generating PDF...' 
      : criticalErrors.length > 0 
        ? `Generate PDF (${criticalErrors.length} errors)` 
        : 'Generate PDF',
    showConfirmation: criticalErrors.length > 0,
    confirmationMessage: `Some required fields are missing (${criticalErrors.length} error${criticalErrors.length !== 1 ? 's' : ''}).\n\nGenerate PDF anyway?`
  }
}
```

### 10.2 Progress Calculation Logic

#### Exact Progress Formula
```typescript
const computeBepProgress = (data: Partial<ProjectData>): number => {
  // Required fields by step (exact mapping)
  const REQUIRED_KEYS = {
    project_overview: ['project_name', 'client_name', 'location', 'project_type'],
    team_responsibilities: ['firms[0].name', 'firms[0].discipline', 'firms[0].bim_lead'],
    software_overview: ['main_tools[0].name'],
    modeling_scope: ['general_lod', 'units'],
    collaboration_cde: ['platform'],
    model_checking: ['clash_detection_tools[0]'],
    geolocation: ['is_georeferenced'],
    // Optional sections contribute 0 to required count
    file_naming: [],
    outputs_deliverables: []
  }
  
  let totalRequired = 0
  let completedRequired = 0
  
  Object.entries(REQUIRED_KEYS).forEach(([section, keys]) => {
    keys.forEach(key => {
      totalRequired++
      
      // Handle array notation (e.g., 'firms[0].name')
      if (key.includes('[') && key.includes(']')) {
        const [arrayPath, ...restPath] = key.split('[')
        const arrayIndex = parseInt(key.match(/\[(\d+)\]/)?.[1] || '0')
        const fieldPath = restPath.join('[').replace(/^\d+\]\.?/, '')
        
        const arrayData = data[section]?.[arrayPath]
        if (Array.isArray(arrayData) && arrayData.length > arrayIndex) {
          const value = fieldPath ? arrayData[arrayIndex][fieldPath] : arrayData[arrayIndex]
          if (value && (typeof value === 'string' ? value.trim() : value)) {
            completedRequired++
          }
        }
      } else {
        // Handle simple field paths
        const value = data[section]?.[key]
        if (value && (typeof value === 'string' ? value.trim() : value)) {
          completedRequired++
        }
      }
    })
  })
  
  return totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0
}

// Step completion indicators
const getStepCompletionStates = (data: Partial<ProjectData>, validationErrors: ValidationIssue[]) => {
  const stepStates = {}
  
  STEP_IDS.forEach((stepId, index) => {
    const stepSection = STEP_SECTIONS[stepId]
    const stepErrors = validationErrors.filter(error => 
      error.section === stepSection && error.severity === 'required'
    )
    
    stepStates[stepId] = {
      isComplete: stepErrors.length === 0,
      hasData: hasAnyData(data[stepSection]),
      errorCount: stepErrors.length,
      warningCount: validationErrors.filter(error => 
        error.section === stepSection && error.severity === 'recommended'
      ).length,
      pillVariant: stepErrors.length === 0 ? 'default' : 'destructive',
      pillIcon: stepErrors.length === 0 ? 'CheckCircle' : 'AlertCircle'
    }
  })
  
  return stepStates
}
```

### 10.3 Live Preview Synchronization

#### Data Sync Logic
```typescript
// Preview data source priority
const getPreviewDataSource = (exportData: BEPExportData | null, formData: Partial<ProjectData>, section: string) => {
  // Priority: 1. Fresh export data, 2. Form data, 3. Empty object
  return exportData?.[section] || formData[section] || {}
}

// Real-time update triggers
const syncPreviewWithForm = useMemo(() => {
  return debounce((formData: Partial<ProjectData>) => {
    // Update preview immediately for better UX
    setPreviewData(formData)
    
    // Trigger background refresh if needed
    if (shouldRefreshPreview(formData)) {
      handleRefresh()
    }
  }, 200)
}, [])

// Preview refresh conditions
const shouldRefreshPreview = (newData: Partial<ProjectData>) => {
  const hasSignificantChanges = [
    'project_overview.project_name',
    'project_overview.client_name',
    'team_responsibilities.firms',
    'software_overview.main_tools'
  ].some(path => {
    const newValue = getValueByPath(newData, path)
    const oldValue = getValueByPath(previewData, path)
    return JSON.stringify(newValue) !== JSON.stringify(oldValue)
  })
  
  return hasSignificantChanges
}
```

### 10.4 PDF Generation Trigger Logic

#### Complete PDF Generation Flow
```typescript
const handlePDFGeneration = async () => {
  // Step 1: Pre-flight validation check
  const criticalErrors = validationErrors.filter(error => error.severity === 'required')
  
  if (criticalErrors.length > 0) {
    // Show confirmation dialog with exact error count
    const shouldProceed = window.confirm(
      `Some required fields are missing (${criticalErrors.length} error${criticalErrors.length !== 1 ? 's' : ''}).\n\n` +
      `Missing fields:\n${criticalErrors.map(e => `• ${e.section}: ${e.message}`).join('\n')}\n\n` +
      `Generate PDF anyway? The PDF will show "—" for missing fields.`
    )
    
    if (!shouldProceed) {
      console.log('[PDF] User cancelled due to validation errors')
      return
    }
    
    console.log('[PDF] User confirmed generation with validation errors:', criticalErrors.length)
  }
  
  setExporting(true)
  const startTime = performance.now()
  
  try {
    // Step 2: Force save current form state
    console.log('[PDF] Ensuring latest data is saved...')
    await ensureLatestSave(projectId, projectData)
    
    // Step 3: Fetch fresh data using unified collector
    console.log('[PDF] Fetching fresh unified data...')
    const freshExportData = await getBepExportData(projectId)
    
    // Step 4: Validate data completeness for PDF
    const pdfValidation = validateProjectData(freshExportData)
    console.log('[PDF] Final validation:', {
      totalIssues: pdfValidation.issues.length,
      requiredErrors: pdfValidation.issues.filter(i => i.severity === 'required').length,
      completeness: pdfValidation.completeness
    })
    
    // Step 5: Map to clean PDF model
    console.log('[PDF] Mapping data to PDF model...')
    const pdfModel = mapProjectDataToPdfModel(freshExportData)
    
    // Step 6: Generate PDF with performance tracking
    console.log('[PDF] Rendering PDF document...')
    const pdf = await renderPdfFromModel(pdfModel, projectId)
    
    // Step 7: Download and version tracking
    const filename = generatePdfFilename(pdfModel.header.projectName)
    pdf.save(filename)
    
    await createVersionEntry(projectId, freshExportData, filename)
    
    const duration = performance.now() - startTime
    console.log('[PDF] Generation completed:', {
      duration: `${Math.round(duration)}ms`,
      filename,
      sectionsIncluded: Object.keys(pdfModel.sections).length,
      exportedWithErrors: criticalErrors.length > 0
    })
    
    toast({
      title: "PDF Generated Successfully",
      description: criticalErrors.length > 0 
        ? `${filename} generated with ${criticalErrors.length} incomplete field(s)` 
        : `${filename} has been downloaded`,
      variant: criticalErrors.length > 0 ? "default" : "default"
    })
    
  } catch (error) {
    const duration = performance.now() - startTime
    console.error('[PDF] Generation failed after', `${Math.round(duration)}ms:`, error)
    
    toast({
      title: "PDF Generation Failed",
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      variant: "destructive"
    })
  } finally {
    setExporting(false)
  }
}
```

### 10.5 Autosave State Management

#### Debounced Save with Status Indicators
```typescript
const useAutosave = (projectId: string, data: Partial<ProjectData>) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const debouncedSave = useMemo(
    () => debounce(async (dataToSave: Partial<ProjectData>) => {
      if (JSON.stringify(dataToSave) === JSON.stringify(lastSavedData.current)) {
        console.log('[AUTOSAVE] No changes detected, skipping save')
        return
      }
      
      setSaveStatus('saving')
      console.log('[AUTOSAVE] Saving changes...', {
        projectId,
        dataSize: JSON.stringify(dataToSave).length,
        timestamp: new Date().toISOString()
      })
      
      try {
        const { error } = await supabase
          .from('projects')
          .update({ 
            project_data: dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
        
        if (error) throw error
        
        setSaveStatus('saved')
        setLastSaved(new Date())
        lastSavedData.current = dataToSave
        
        // Emit data update event for other components
        bepDataEvents.emit('bep:data-updated', projectId, dataToSave)
        
        console.log('[AUTOSAVE] Save completed successfully')
        
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)
        
      } catch (error) {
        console.error('[AUTOSAVE] Save failed:', error)
        setSaveStatus('error')
        
        toast({
          title: "Autosave Failed",
          description: error.message,
          variant: "destructive"
        })
      }
    }, 500),
    [projectId]
  )
  
  // Save status display logic
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return { text: 'Saving...', icon: 'RotateCw', className: 'text-blue-600 animate-spin' }
      case 'saved':
        return { 
          text: `Saved ${formatDistanceToNow(lastSaved)} ago`, 
          icon: 'CheckCircle', 
          className: 'text-green-600' 
        }
      case 'error':
        return { text: 'Save failed', icon: 'AlertCircle', className: 'text-red-600' }
      default:
        return { text: 'Changes will be saved automatically', icon: 'Clock', className: 'text-muted-foreground' }
    }
  }
  
  return { debouncedSave, saveStatus, getSaveStatusDisplay }
}
```

---

## 11. Mock Data Example

### 11.1 Complete Sample Project Data

```json
{
  "id": "sample-bep-project-001",
  "name": "Downtown Mixed-Use Development",
  "client_name": "Urban Development Partners LLC",
  "location": "Seattle, WA, USA",
  "project_type": "Mixed-Use Commercial/Residential",
  "status": "active",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "project_data": {
    "project_overview": {
      "project_name": "Downtown Mixed-Use Development",
      "client_name": "Urban Development Partners LLC",
      "location": "Seattle, WA, USA",
      "project_type": "Mixed-Use Commercial/Residential",
      "description": "A 25-story mixed-use development featuring retail spaces on levels 1-3, office spaces on levels 4-15, and residential units on levels 16-25. The project includes underground parking for 300 vehicles and incorporates sustainable design principles targeting LEED Gold certification.",
      "key_milestones": [
        {
          "name": "Design Development Complete",
          "date": "2024-03-15",
          "description": "Completion of all design development documents and client approval"
        },
        {
          "name": "Construction Documents Issued",
          "date": "2024-06-01",
          "description": "100% construction documents ready for permitting and bidding"
        },
        {
          "name": "Permit Approval",
          "date": "2024-08-15",
          "description": "Building permit approval from City of Seattle"
        },
        {
          "name": "Construction Start",
          "date": "2024-09-01",
          "description": "Groundbreaking and construction commencement"
        },
        {
          "name": "Substantial Completion",
          "date": "2026-03-01",
          "description": "Building ready for occupancy"
        }
      ]
    },
    "team_responsibilities": {
      "firms": [
        {
          "name": "Skyline Architecture Group",
          "discipline": "Architecture",
          "bim_lead": "Sarah Johnson, AIA",
          "contact_info": "sarah.johnson@skylinearch.com | (206) 555-0123",
          "responsibilities": ["Design development", "Construction documents", "3D modeling", "Renderings"]
        },
        {
          "name": "Pacific Northwest Engineering",
          "discipline": "Structural Engineering", 
          "bim_lead": "Michael Chen, PE",
          "contact_info": "mchen@pnweng.com | (206) 555-0456",
          "responsibilities": ["Structural analysis", "Foundation design", "Steel detailing", "Coordination"]
        },
        {
          "name": "Green Systems MEP",
          "discipline": "Mechanical/Electrical/Plumbing",
          "bim_lead": "Jessica Rodriguez, PE",
          "contact_info": "j.rodriguez@greensystemsmep.com | (206) 555-0789",
          "responsibilities": ["HVAC design", "Electrical systems", "Plumbing design", "Fire protection"]
        },
        {
          "name": "Urban Civil Consultants",
          "discipline": "Civil Engineering",
          "bim_lead": "David Park, PE",
          "contact_info": "dpark@urbancivil.com | (206) 555-0321",
          "responsibilities": ["Site design", "Utilities", "Grading", "Stormwater management"]
        }
      ]
    },
    "software_overview": {
      "main_tools": [
        {
          "name": "Autodesk Revit",
          "version": "2024",
          "discipline": "Architecture",
          "purpose": "Primary BIM authoring tool for architectural design"
        },
        {
          "name": "Autodesk Revit",
          "version": "2024", 
          "discipline": "Structural",
          "purpose": "Structural modeling and documentation"
        },
        {
          "name": "Autodesk Revit",
          "version": "2024",
          "discipline": "MEP",
          "purpose": "MEP systems design and coordination"
        },
        {
          "name": "AutoCAD Civil 3D",
          "version": "2024",
          "discipline": "Civil",
          "purpose": "Site design and civil engineering"
        }
      ],
      "team_specific_tools": [
        {
          "name": "Rhino 7",
          "version": "7.22",
          "discipline": "Architecture",
          "team": "Design Team"
        },
        {
          "name": "Grasshopper",
          "version": "1.0.0007",
          "discipline": "Architecture", 
          "team": "Computational Design"
        },
        {
          "name": "Robot Structural Analysis",
          "version": "2024",
          "discipline": "Structural",
          "team": "Analysis Team"
        },
        {
          "name": "Bentley STAAD Pro",
          "version": "V8i",
          "discipline": "Structural",
          "team": "Foundation Design"
        },
        {
          "name": "Trane TRACE 3D Plus",
          "version": "6.3.4",
          "discipline": "Mechanical",
          "team": "HVAC Design"
        }
      ]
    },
    "modeling_scope": {
      "general_lod": "LOD 300",
      "units": "Imperial (feet and inches)",
      "levels_grids_strategy": "Shared coordinates system with common grid and level strategy across all disciplines. Grid lines every 30' typical, with custom grids for structural bays. Levels established for each floor with consistent naming convention (Level 01, Level 02, etc.)",
      "discipline_lods": [
        {
          "discipline": "Architecture",
          "lod_level": "LOD 300",
          "description": "Generic assemblies with approximate quantities, size, shape, location, and orientation"
        },
        {
          "discipline": "Structural",
          "lod_level": "LOD 350", 
          "description": "Specific assemblies with precise quantity, size, shape, location, and orientation, plus interfaces with other systems"
        },
        {
          "discipline": "Mechanical",
          "lod_level": "LOD 300",
          "description": "Generic systems with approximate size and location for coordination"
        },
        {
          "discipline": "Electrical",
          "lod_level": "LOD 300",
          "description": "Generic systems with approximate size and location for coordination" 
        },
        {
          "discipline": "Plumbing",
          "lod_level": "LOD 300",
          "description": "Generic systems with approximate size and location for coordination"
        },
        {
          "discipline": "Civil",
          "lod_level": "LOD 300",
          "description": "Site elements modeled to scale with accurate positioning"
        }
      ]
    },
    "file_naming": {
      "use_conventions": true,
      "prefix_format": "PROJECT-DISC-ZONE-TYPE-SEQ",
      "discipline_codes": "AR (Architecture), ST (Structural), ME (Mechanical), EL (Electrical), PL (Plumbing), CV (Civil)",
      "versioning_format": "Sequential numbering with milestone tags (001, 002, etc. with DD, CD, CA suffixes)",
      "examples": [
        "DOWNTOWN-AR-T01-FLR-001_DD.rvt (Architectural floor plans - Design Development)",
        "DOWNTOWN-ST-B01-FRM-003_CD.rvt (Structural framing - Construction Documents)", 
        "DOWNTOWN-ME-ALL-HVC-002_CD.rvt (Mechanical HVAC systems - Construction Documents)",
        "DOWNTOWN-CV-SITE-GRD-001_DD.dwg (Civil grading plan - Design Development)"
      ]
    },
    "collaboration_cde": {
      "platform": "Autodesk Construction Cloud (ACC)",
      "file_linking_method": "Central model linking with publish/subscribe workflow",
      "sharing_frequency": "Daily coordination uploads, weekly milestone publications",
      "setup_responsibility": "Architecture team leads CDE setup and maintenance",
      "access_permissions": "Role-based access: Admin (BIM leads), Contributor (modelers), Viewer (consultants and reviewers)"
    },
    "geolocation": {
      "is_georeferenced": true,
      "coordinate_system": "Washington State Plane North (NAD83/NSRS2007), EPSG:3857",
      "coordinate_setup": "Project base point established at building corner with known surveyed coordinates",
      "origin_location": "Southwest corner of building at intersection of 3rd Avenue and Pine Street, Seattle, WA"
    },
    "model_checking": {
      "clash_detection_tools": ["Autodesk Navisworks Manage", "Solibri Model Checker"],
      "coordination_process": "Weekly clash detection runs with automated reporting. Critical clashes resolved within 48 hours, non-critical within 1 week.",
      "meeting_frequency": "Bi-weekly coordination meetings with all disciplines, monthly client progress reviews",
      "responsibility_matrix": "Architecture leads overall coordination, each discipline responsible for resolving clashes within their scope, MEP coordinates all systems integration"
    },
    "outputs_deliverables": {
      "deliverables_by_phase": [
        {
          "phase": "Schematic Design",
          "deliverables": ["Massing models", "Concept floor plans", "Building sections", "3D visualizations"],
          "formats": ["PDF", "DWG", "3D PDF", "Rendered images"],
          "responsibility": "Architecture team with input from all disciplines"
        },
        {
          "phase": "Design Development", 
          "deliverables": ["Coordinated discipline models", "Floor plans", "Elevations", "Sections", "Details", "Schedules"],
          "formats": ["PDF", "DWG", "RVT", "IFC", "Navisworks"],
          "responsibility": "All disciplines with architecture coordination"
        },
        {
          "phase": "Construction Documents",
          "deliverables": ["100% construction documents", "Coordinated BIM models", "Clash reports", "Specifications"],
          "formats": ["PDF", "DWG", "RVT", "IFC", "Specifications"],
          "responsibility": "All disciplines with final QA/QC review"
        },
        {
          "phase": "Construction Administration",
          "deliverables": ["Model updates", "RFI responses", "Change order documentation", "As-built models"],
          "formats": ["PDF", "DWG", "RVT", "Marked-up drawings"],
          "responsibility": "Design team with contractor input"
        },
        {
          "phase": "Project Closeout",
          "deliverables": ["As-built BIM models", "Operation manuals", "Warranty information", "Facility management data"],
          "formats": ["IFC", "COBie", "PDF", "Equipment schedules"],
          "responsibility": "All disciplines with facility management team"
        }
      ]
    }
  }
}
```

### 11.2 Validation Results for Sample Project

When this sample project is validated, it should achieve:

- **Progress:** 100% completion
- **Validation Errors:** 0 required field errors
- **Validation Warnings:** 0 recommended field warnings  
- **PDF Export:** Clean generation with no missing data placeholders

### 11.3 Expected PDF Output Sections

The sample project should generate a professional PDF with:

1. **Cover Page** with project name, client, and generation date
2. **Project Overview** with complete information and 5 milestones
3. **Team & Responsibilities** showing 4 firms with complete contact details
4. **Software Overview** listing 4 main tools and 5 specialized tools
5. **Modeling Scope** with LOD 300 baseline and 6 discipline-specific LODs
6. **File Naming** with clear conventions and 4 examples
7. **Collaboration & CDE** with Autodesk ACC platform details
8. **Geolocation** with full georeferencing information
9. **Model Checking** with 2 tools and detailed coordination process
10. **Outputs & Deliverables** covering 5 project phases with specific deliverables

---

## Conclusion

This comprehensive technical summary provides all necessary information to rebuild or migrate BIMxPlan Go to another platform. The document covers every aspect from UI components and user flows to database schemas and complex validation logic. All conditional expressions, state management patterns, and integration details are documented with exact implementation specifications.

The sample project data can be used immediately to test any rebuilt system and verify that it produces the same professional BEP output as the original application.

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*Generated for: Migration/Rebuild Documentation*
