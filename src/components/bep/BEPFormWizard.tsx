import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Save, Download, FileText, Check, AlertCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProjectOverviewForm } from "./forms/ProjectOverviewForm"
import { TeamResponsibilitiesForm } from "./forms/TeamResponsibilitiesForm"
import { SoftwareOverviewForm } from "./forms/SoftwareOverviewForm"
import { ModelingScopeForm } from "./forms/ModelingScopeForm"
import { FileNamingForm } from "./forms/FileNamingForm"
import { CollaborationCDEForm } from "./forms/CollaborationCDEForm"
import { GeolocationForm } from "./forms/GeolocationForm"
import { ModelCheckingForm } from "./forms/ModelCheckingForm"
import { OutputsDeliverablesForm } from "./forms/OutputsDeliverablesForm"
import { EnhancedBEPPreview } from "./EnhancedBEPPreview"
import { ProjectData } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { validateStep, validateProjectData, ValidationReport } from "./BEPValidationService"

interface BEPFormWizardProps {
  onClose: () => void
  initialData?: any
  onUpdate?: (data: any) => void
  projectId?: string
}

interface StepValidation {
  isValid: boolean
  issues: string[]
}

const STEPS = [
  { id: 'overview', title: 'Project Overview', component: ProjectOverviewForm, required: ['project_name', 'client_name', 'location', 'project_type'] },
  { id: 'team', title: 'Team & Responsibilities', component: TeamResponsibilitiesForm, required: ['firms'] },
  { id: 'software', title: 'Software Overview', component: SoftwareOverviewForm, required: ['main_tools'] },
  { id: 'modeling', title: 'Modeling Scope', component: ModelingScopeForm, required: ['general_lod', 'units'] },
  { id: 'naming', title: 'File Naming', component: FileNamingForm, required: [] },
  { id: 'collaboration', title: 'Collaboration & CDE', component: CollaborationCDEForm, required: ['platform'] },
  { id: 'geolocation', title: 'Geolocation', component: GeolocationForm, required: ['is_georeferenced'] },
  { id: 'checking', title: 'Model Checking', component: ModelCheckingForm, required: ['clash_detection_tools'] },
  { id: 'outputs', title: 'Outputs & Deliverables', component: OutputsDeliverablesForm, required: [] },
  { id: 'preview', title: 'Preview & Export', component: EnhancedBEPPreview, required: [] },
]

export function BEPFormWizard({ onClose, initialData = {}, onUpdate, projectId }: BEPFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [projectData, setProjectData] = useState<Partial<ProjectData>>(initialData)
  const [stepValidations, setStepValidations] = useState<Record<string, StepValidation>>({})
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const progress = ((currentStep + 1) / STEPS.length) * 100

  // Enhanced logging
  const logAction = useCallback((action: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      action,
      projectId: projectId || 'undefined',
      currentStep: currentStep + 1,
      stepId: STEPS[currentStep].id,
      dataSize: JSON.stringify(projectData).length,
      ...data
    }
    console.log(`[BEP-WIZARD-${action}]`, logData)
    return logData
  }, [projectId, currentStep, projectData])

  // Enhanced validation function
  const validateCurrentStep = useCallback((stepId: string, stepData: any): StepValidation => {
    return validateStep(stepId, stepData)
  }, [])

  // Update validation report when project data changes
  const updateValidationReport = useCallback((data: Partial<ProjectData>) => {
    const report = validateProjectData(data)
    setValidationReport(report)
    return report
  }, [])

  // Auto-save functionality
  const triggerAutoSave = useCallback(async (data: Partial<ProjectData>) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    const timeout = setTimeout(async () => {
      try {
        logAction('AUTOSAVE_START')
        if (onUpdate) {
          await onUpdate(data)
          setLastSaved(new Date())
          logAction('AUTOSAVE_SUCCESS')
        }
      } catch (error) {
        logAction('AUTOSAVE_ERROR', { error: error.message })
        console.error('Auto-save failed:', error)
      }
    }, 500) // 500ms debounce

    setAutoSaveTimeout(timeout)
  }, [autoSaveTimeout, onUpdate, logAction])

  const handleNext = () => {
    const currentStepValidation = validateCurrentStep(STEPS[currentStep].id, projectData[STEPS[currentStep].id])
    
    if (!currentStepValidation.isValid) {
      toast({
        title: "Validation Required",
        description: `Please complete all required fields: ${currentStepValidation.issues.join(', ')}`,
        variant: "destructive",
      })
      return
    }

    if (currentStep < STEPS.length - 1) {
      logAction('STEP_NEXT', { from: currentStep, to: currentStep + 1 })
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      logAction('STEP_PREVIOUS', { from: currentStep, to: currentStep - 1 })
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepUpdate = (stepData: any) => {
    const stepKey = STEPS[currentStep].id
    const updatedData = {
      ...projectData,
      [stepKey]: stepData
    }
    
    logAction('STEP_UPDATE', { stepKey, hasData: !!stepData })
    setProjectData(updatedData)
    
    // Validate step
    const validation = validateCurrentStep(stepKey, stepData)
    setStepValidations(prev => ({
      ...prev,
      [stepKey]: validation
    }))
    
    // Update overall validation report
    updateValidationReport(updatedData)
    
    // Trigger auto-save
    triggerAutoSave(updatedData)
  }

  const handleSave = async () => {
    if (isSaving) return
    
    setIsSaving(true)
    try {
      logAction('MANUAL_SAVE_START')
      if (onUpdate) {
        await onUpdate(projectData)
        setLastSaved(new Date())
        toast({
          title: "Saved ✓",
          description: `Project saved at ${new Date().toLocaleTimeString()}`,
        })
        logAction('MANUAL_SAVE_SUCCESS')
      }
    } catch (error) {
      logAction('MANUAL_SAVE_ERROR', { error: error.message })
      toast({
        title: "Save Failed",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Load project data on mount
  useEffect(() => {
    if (projectId) {
      logAction('PROJECT_LOAD_START')
      // Validate all steps on load
      const validations: Record<string, StepValidation> = {}
      STEPS.forEach(step => {
        validations[step.id] = validateCurrentStep(step.id, projectData[step.id])
      })
      setStepValidations(validations)
      
      // Update validation report
      updateValidationReport(projectData)
      
      logAction('PROJECT_LOAD_SUCCESS', { validationsCount: Object.keys(validations).length })
    }
  }, [projectId, validateCurrentStep, updateValidationReport, logAction, projectData])

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [autoSaveTimeout])

  // Get step status
  const getStepStatus = (stepIndex: number) => {
    const step = STEPS[stepIndex]
    const validation = stepValidations[step.id]
    
    if (!validation) return 'pending'
    return validation.isValid ? 'valid' : 'invalid'
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

        {/* Progress & Status */}
        <div className="mb-8">
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">Progress: {Math.round(progress)}%</span>
              {validationReport && (
                <div className="flex items-center space-x-1 text-xs">
                  <Badge variant={validationReport.hasErrors ? "destructive" : validationReport.hasWarnings ? "secondary" : "default"}>
                    {validationReport.completeness}% Complete
                  </Badge>
                </div>
              )}
              {lastSaved && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              {isSaving && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
            <span className="text-muted-foreground">{currentStep + 1} / {STEPS.length}</span>
          </div>
          
          {/* Step Navigation Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {STEPS.map((step, index) => {
              const status = getStepStatus(index)
              return (
                <Button
                  key={step.id}
                  variant={index === currentStep ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentStep(index)}
                  className="flex items-center space-x-1"
                >
                  <span>{index + 1}</span>
                  {status === 'valid' && <Check className="h-3 w-3 text-green-500" />}
                  {status === 'invalid' && <AlertCircle className="h-3 w-3 text-red-500" />}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle>{STEPS[currentStep].title}</CardTitle>
                {stepValidations[STEPS[currentStep].id] && (
                  <Badge variant={stepValidations[STEPS[currentStep].id].isValid ? "default" : "destructive"}>
                    {stepValidations[STEPS[currentStep].id].isValid ? "Complete" : "Incomplete"}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
            {stepValidations[STEPS[currentStep].id] && !stepValidations[STEPS[currentStep].id].isValid && (
              <div className="mt-2 text-sm text-red-600">
                Required: {stepValidations[STEPS[currentStep].id].issues.join(', ')}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {STEPS[currentStep].id === 'preview' ? (
              React.createElement(CurrentStepComponent as any, {
                data: projectData['preview' as keyof ProjectData],
                onUpdate: handleStepUpdate,
                projectData: projectData,
                projectId,
                onSave: handleSave,
              })
            ) : (
              <CurrentStepComponent 
                data={projectData[STEPS[currentStep].id as keyof ProjectData]} 
                onUpdate={handleStepUpdate}
                projectData={projectData}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6">
          <div className="flex justify-between w-full sm:w-auto order-2 sm:order-1">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 0}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>

          <div className="flex space-x-2 order-3 sm:order-2">
            <Button 
              variant="outline" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Saving..." : "Save Progress"}
              </span>
              <span className="sm:hidden">
                {isSaving ? "..." : "Save"}
              </span>
            </Button>
          </div>

          <div className="flex justify-end w-full sm:w-auto order-1 sm:order-3">
            {currentStep < STEPS.length - 1 ? (
              <Button 
                onClick={handleNext} 
                className="flex-1 sm:flex-none"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">
                Use the Preview & Export step to generate your BEP document
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}