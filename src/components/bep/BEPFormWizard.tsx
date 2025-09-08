import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Save, Download, FileText, Check, AlertCircle, Clock, RefreshCw } from "lucide-react"
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
import { computeBepProgress, BEPProgress } from "./BEPProgressCalculator"
import { bepDataEvents } from "./BEPDataEvents"
import { getBepExportData } from "./BEPDataCollector"

interface BEPFormWizardProps {
  onClose: () => void
  initialData?: Record<string, unknown>
  onUpdate?: (data: Record<string, unknown>) => void
  projectId?: string
}

interface StepValidation {
  isValid: boolean
  issues: string[]
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
  { id: 'preview', title: 'Preview & Export', component: EnhancedBEPPreview },
]

export function BEPFormWizard({ onClose, initialData = {}, onUpdate, projectId }: BEPFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [projectData, setProjectData] = useState<Partial<ProjectData>>(initialData)
  const [stepValidations, setStepValidations] = useState<Record<string, StepValidation>>({})
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [progressData, setProgressData] = useState<BEPProgress | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isRehydrating, setIsRehydrating] = useState(false)
  
  // Enhanced autosave with debouncing
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveDataRef = useRef<string>('')

  const stepProgress = ((currentStep + 1) / STEPS.length) * 100
  const dataProgress = progressData?.overallPercent || 0

  // Enhanced logging
  const logAction = useCallback((action: string, data?: Record<string, unknown>) => {
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

  // Rehydrate from getBepExportData on mount
  const rehydrateFromServer = useCallback(async () => {
    if (!projectId) return
    
    setIsRehydrating(true)
    try {
      logAction('REHYDRATE_START')
      const exportData = await getBepExportData(projectId)
      
      // Extract project data from export structure
      const rehydratedData: Partial<ProjectData> = {
        project_overview: exportData.projectOverview,
        team_responsibilities: exportData.teamResponsibilities,
        software_overview: exportData.softwareOverview,
        modeling_scope: exportData.modelingScope,
        file_naming: exportData.fileNaming,
        collaboration_cde: exportData.collaborationCDE,
        geolocation: exportData.geolocation,
        model_checking: exportData.modelChecking,
        outputs_deliverables: exportData.outputsDeliverables
      }
      
      // Remove undefined sections
      Object.keys(rehydratedData).forEach(key => {
        if (rehydratedData[key as keyof ProjectData] === undefined) {
          delete rehydratedData[key as keyof ProjectData]
        }
      })
      
      setProjectData(rehydratedData)
      updateValidationReport(rehydratedData)
      
      logAction('REHYDRATE_SUCCESS', { 
        sectionsLoaded: Object.keys(rehydratedData).length
      })
      
      toast({
        title: "Data Loaded",
        description: "Previous progress has been restored"
      })
    } catch (error) {
      logAction('REHYDRATE_ERROR', { error: error.message })
      console.error('Failed to rehydrate data:', error)
    } finally {
      setIsRehydrating(false)
    }
  }, [projectId, logAction])

  // Enhanced validation function
  const validateCurrentStep = useCallback((stepId: string, stepData: Record<string, unknown>): StepValidation => {
    return validateStep(stepId, stepData)
  }, [])

  // Update validation report and progress when project data changes
  const updateValidationReport = useCallback((data: Partial<ProjectData>) => {
    const report = validateProjectData(data)
    setValidationReport(report)
    
    console.log('[BEP-VALIDATION-DEBUG]', {
      timestamp: new Date().toISOString(),
      projectId,
      validationPaths: report.issues.map(i => `${i.section}.${i.field}`),
      completeness: report.completeness,
      totalIssues: report.issues.length,
      criticalErrors: report.issues.filter(i => i.severity === 'required').length
    })
    
    // Calculate progress using the new progress calculator
    const progress = computeBepProgress(data)
    setProgressData(progress)
    
    console.log('[BEP-PROGRESS-DEBUG]', {
      timestamp: new Date().toISOString(),
      projectId,
      overallPercent: progress.overallPercent,
      completedSteps: progress.completedSteps,
      totalSteps: progress.totalSteps,
      stepBreakdown: progress.perStep.map(s => ({
        step: s.step,
        title: s.title,
        complete: s.complete,
        percent: s.percent
      }))
    })
    
    // Emit single event per update to prevent double renders
    if (projectId) {
      bepDataEvents.emit('bep:data-updated', projectId, {
        validation: report,
        progress: progress,
        data: data
      })
    }
    
    return report
  }, [projectId])

  // Enhanced debounced autosave with payload comparison
  const triggerAutoSave = useCallback(async (data: Partial<ProjectData>) => {
    if (!onUpdate || !projectId) return
    
    // Prevent saving identical payloads
    const currentDataString = JSON.stringify(data)
    if (currentDataString === lastSaveDataRef.current) {
      console.log('[BEP-AUTOSAVE] Skipping - identical payload')
      return
    }
    
    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout with 500ms debounce
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        logAction('AUTOSAVE_START')
        await onUpdate(data)
        setLastSaved(new Date())
        lastSaveDataRef.current = currentDataString
        logAction('AUTOSAVE_SUCCESS')
        
        // Show subtle save indicator
        console.log('[BEP-AUTOSAVE] Saved at', new Date().toLocaleTimeString())
      } catch (error) {
        logAction('AUTOSAVE_ERROR', { error: error.message })
        console.error('Auto-save failed:', error)
        // Don't show toast for autosave failures to avoid spam
      }
    }, 500) // 500ms debounce
  }, [onUpdate, projectId, logAction])

  const handleNext = () => {
    const currentStepValidation = validateCurrentStep(STEPS[currentStep].id, projectData[STEPS[currentStep].id as keyof ProjectData])
    
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

  const handleStepUpdate = (stepData: Record<string, unknown>) => {
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
    
    // Update overall validation report and progress
    updateValidationReport(updatedData)
    
    // Trigger auto-save with debouncing
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

  // Rehydrate data on mount
  useEffect(() => {
    if (projectId) {
      rehydrateFromServer()
    }
  }, [projectId, rehydrateFromServer])

  // Validate all steps when data changes
  useEffect(() => {
    if (Object.keys(projectData).length > 0) {
      const validations: Record<string, StepValidation> = {}
      STEPS.forEach(step => {
        if (step.id !== 'preview') {
          validations[step.id] = validateCurrentStep(step.id, projectData[step.id as keyof ProjectData])
        }
      })
      setStepValidations(validations)
      updateValidationReport(projectData)
    }
  }, [projectData, validateCurrentStep, updateValidationReport])

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Get step status for UI indicators
  const getStepStatus = (stepIndex: number) => {
    const step = STEPS[stepIndex]
    if (step.id === 'preview') return 'valid' // Preview step is always valid
    
    const validation = stepValidations[step.id]
    if (!validation) return 'pending'
    return validation.isValid ? 'valid' : 'invalid'
  }

  const CurrentStepComponent = STEPS[currentStep].component

  if (isRehydrating) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loading Your BEP</h2>
            <p className="text-muted-foreground">Restoring your previous progress...</p>
          </div>
        </div>
      </div>
    )
  }

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
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step Progress</span>
              <span>{Math.round(stepProgress)}%</span>
            </div>
            <Progress value={stepProgress} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span>Data Completion</span>
              <span>{dataProgress}%</span>
            </div>
            <Progress value={dataProgress} className="h-3" />
          </div>
          
          <div className="flex justify-between items-center text-sm mt-4">
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">
                {progressData ? `${progressData.completedSteps}/${progressData.totalSteps} steps` : 'Calculating...'}
              </span>
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
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">{currentStep + 1} / {STEPS.length}</span>
            </div>
          </div>
          
          {/* Step Navigation Pills - Updated immediately on save */}
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
                {stepValidations[STEPS[currentStep].id] && STEPS[currentStep].id !== 'preview' && (
                  <Badge variant={stepValidations[STEPS[currentStep].id].isValid ? "default" : "destructive"}>
                    {stepValidations[STEPS[currentStep].id].isValid ? "Complete" : "Incomplete"}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
            {stepValidations[STEPS[currentStep].id] && !stepValidations[STEPS[currentStep].id].isValid && STEPS[currentStep].id !== 'preview' && (
              <div className="mt-2 text-sm text-red-600">
                Required: {stepValidations[STEPS[currentStep].id].issues.join(', ')}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {STEPS[currentStep].id === 'preview' ? (
              React.createElement(CurrentStepComponent as React.ComponentType<Record<string, unknown>>, {
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