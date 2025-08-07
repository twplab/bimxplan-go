import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Save, Download, FileText } from "lucide-react"
import { ProjectOverviewForm } from "./forms/ProjectOverviewForm"
import { TeamResponsibilitiesForm } from "./forms/TeamResponsibilitiesForm"
import { SoftwareOverviewForm } from "./forms/SoftwareOverviewForm"
import { ModelingScopeForm } from "./forms/ModelingScopeForm"
import { FileNamingForm } from "./forms/FileNamingForm"
import { CollaborationCDEForm } from "./forms/CollaborationCDEForm"
import { GeolocationForm } from "./forms/GeolocationForm"
import { ModelCheckingForm } from "./forms/ModelCheckingForm"
import { OutputsDeliverablesForm } from "./forms/OutputsDeliverablesForm"
import { BEPPreview } from "./BEPPreview"
import { ProjectData } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface BEPFormWizardProps {
  onClose: () => void
}

const STEPS = [
  { id: 'overview', title: 'Project Overview', component: ProjectOverviewForm },
  { id: 'team', title: 'Team & Responsibilities', component: TeamResponsibilitiesForm },
  { id: 'software', title: 'Software Overview', component: SoftwareOverviewForm },
  { id: 'modeling', title: 'Modeling Scope', component: ModelingScopeForm },
  { id: 'naming', title: 'File Naming', component: FileNamingForm },
  { id: 'collaboration', title: 'Collaboration & CDE', component: CollaborationCDEForm },
  { id: 'geolocation', title: 'Geolocation', component: GeolocationForm },
  { id: 'checking', title: 'Model Checking', component: ModelCheckingForm },
  { id: 'outputs', title: 'Outputs & Deliverables', component: OutputsDeliverablesForm },
  { id: 'preview', title: 'Preview & Export', component: BEPPreview },
]

export function BEPFormWizard({ onClose }: BEPFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [projectData, setProjectData] = useState<Partial<ProjectData>>({})

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepUpdate = (stepData: any) => {
    const stepKey = STEPS[currentStep].id
    setProjectData(prev => ({
      ...prev,
      [stepKey]: stepData
    }))
  }

  const handleSave = async () => {
    // Save to database logic
    toast({
      title: "Project Saved",
      description: "Your BIM execution plan has been saved successfully.",
    })
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">BIM Execution Plan</h1>
            <p className="text-muted-foreground">Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress: {Math.round(progress)}%</span>
            <span>{currentStep + 1} / {STEPS.length}</span>
          </div>
        </div>

        {/* Form Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent 
              data={projectData[STEPS[currentStep].id as keyof ProjectData]} 
              onUpdate={handleStepUpdate}
              projectData={projectData}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </Button>
          </div>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Export Markdown
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}