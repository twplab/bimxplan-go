import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { OutputsDeliverables } from "@/lib/supabase"
import { Plus, Trash2, Package, Calendar } from "lucide-react"

const outputsDeliverablesSchema = z.object({
  deliverables_by_phase: z.array(z.object({
    phase: z.string().min(1, "Phase is required"),
    deliverables: z.array(z.string()),
    formats: z.array(z.string()),
    responsibility: z.string(),
  })),
  formats_standards: z.array(z.string()),
  milestone_schedule: z.array(z.object({
    milestone: z.string(),
    deadline: z.string(),
    deliverables: z.array(z.string()),
  })),
})

type OutputsDeliverablesFormData = z.infer<typeof outputsDeliverablesSchema>

interface OutputsDeliverablesFormProps {
  data?: Partial<OutputsDeliverables>
  onUpdate: (data: OutputsDeliverablesFormData) => void
}

const PROJECT_PHASES = [
  "Schematic Design",
  "Design Development", 
  "Construction Documents",
  "Tender/Bidding",
  "Construction Administration",
  "As-Built/Handover"
]

const DELIVERABLE_TYPES = [
  "3D Models",
  "2D Drawings",
  "Renderings",
  "Clash Reports",
  "Quantity Takeoffs",
  "Specifications",
  "Coordination Models",
  "Analysis Reports"
]

const FILE_FORMATS = [
  "Native BIM (RVT, PLN, etc.)",
  "IFC",
  "PDF",
  "DWG",
  "DXF", 
  "3D PDF",
  "NWD/NWF",
  "BCF"
]

export function OutputsDeliverablesForm({ data, onUpdate }: OutputsDeliverablesFormProps) {
  const form = useForm<OutputsDeliverablesFormData>({
    resolver: zodResolver(outputsDeliverablesSchema),
    defaultValues: {
      deliverables_by_phase: data?.deliverables_by_phase || [
        { phase: "Design Development", deliverables: [], formats: [], responsibility: "" }
      ],
      formats_standards: data?.formats_standards || [],
      milestone_schedule: data?.milestone_schedule || [],
    },
  })

  const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
    control: form.control,
    name: "deliverables_by_phase",
  })

  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control: form.control,
    name: "milestone_schedule",
  })

  const onSubmit = (values: OutputsDeliverablesFormData) => {
    onUpdate(values)
  }

  const formatStandards = form.watch("formats_standards")

  const toggleFormat = (format: string) => {
    const current = formatStandards || []
    const updated = current.includes(format)
      ? current.filter(f => f !== format)
      : [...current, format]
    form.setValue("formats_standards", updated)
  }

  const toggleDeliverable = (phaseIndex: number, deliverable: string) => {
    const currentDeliverables = form.watch(`deliverables_by_phase.${phaseIndex}.deliverables`) || []
    const updated = currentDeliverables.includes(deliverable)
      ? currentDeliverables.filter(d => d !== deliverable)
      : [...currentDeliverables, deliverable]
    form.setValue(`deliverables_by_phase.${phaseIndex}.deliverables`, updated)
  }

  const togglePhaseFormat = (phaseIndex: number, format: string) => {
    const currentFormats = form.watch(`deliverables_by_phase.${phaseIndex}.formats`) || []
    const updated = currentFormats.includes(format)
      ? currentFormats.filter(f => f !== format)
      : [...currentFormats, format]
    form.setValue(`deliverables_by_phase.${phaseIndex}.formats`, updated)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Formats & Standards */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Formats & Standards</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormLabel>Standard File Formats</FormLabel>
              <FormDescription>
                Select the file formats that will be used for deliverables throughout the project
              </FormDescription>
              
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {FILE_FORMATS.map((format) => (
                  <div key={format} className="flex items-center space-x-3 py-1">
                    <Checkbox
                      id={format}
                      checked={formatStandards?.includes(format) || false}
                      onCheckedChange={() => toggleFormat(format)}
                      className="mt-0.5"
                    />
                    <label 
                      htmlFor={format}
                      className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 min-h-[44px] flex items-center"
                    >
                      {format}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliverables by Phase */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg">Deliverables by Project Phase</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => appendPhase({ phase: "", deliverables: [], formats: [], responsibility: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Phase
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {phaseFields.map((field, phaseIndex) => (
                <Card key={field.id} className="border-2 border-dashed border-muted">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h4 className="text-sm font-medium">Phase {phaseIndex + 1}</h4>
                    {phaseFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePhase(phaseIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`deliverables_by_phase.${phaseIndex}.phase`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phase Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select phase" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PROJECT_PHASES.map((phase) => (
                                  <SelectItem key={phase} value={phase}>
                                    {phase}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`deliverables_by_phase.${phaseIndex}.responsibility`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Responsibility</FormLabel>
                            <FormControl>
                              <Input placeholder="Lead Architect, BIM Manager..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormLabel className="text-sm">Deliverable Types</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {DELIVERABLE_TYPES.map((deliverable) => (
                          <div key={deliverable} className="flex items-center space-x-3 py-1">
                            <Checkbox
                              id={`${phaseIndex}-${deliverable}`}
                              checked={form.watch(`deliverables_by_phase.${phaseIndex}.deliverables`)?.includes(deliverable) || false}
                              onCheckedChange={() => toggleDeliverable(phaseIndex, deliverable)}
                              className="mt-0.5"
                            />
                            <label 
                              htmlFor={`${phaseIndex}-${deliverable}`}
                              className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 min-h-[44px] flex items-center"
                            >
                              {deliverable}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FormLabel className="text-sm">Required Formats</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {FILE_FORMATS.map((format) => (
                          <div key={format} className="flex items-center space-x-3 py-1">
                            <Checkbox
                              id={`${phaseIndex}-format-${format}`}
                              checked={form.watch(`deliverables_by_phase.${phaseIndex}.formats`)?.includes(format) || false}
                              onCheckedChange={() => togglePhaseFormat(phaseIndex, format)}
                              className="mt-0.5"
                            />
                            <label 
                              htmlFor={`${phaseIndex}-format-${format}`}
                              className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 min-h-[44px] flex items-center"
                            >
                              {format}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Milestone Schedule */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg">Milestone Schedule</CardTitle>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => appendSchedule({ milestone: "", deadline: "", deliverables: [] })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scheduleFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No milestones added yet. Click "Add Milestone" to define key delivery dates.
              </p>
            ) : (
              <div className="space-y-4">
                {scheduleFields.map((field, index) => (
                  <Card key={field.id} className="border-2 border-dashed border-muted">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`milestone_schedule.${index}.milestone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Milestone</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Design Development Complete" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`milestone_schedule.${index}.deadline`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Deadline</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`milestone_schedule.${index}.deliverables`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Key Deliverables</FormLabel>
                                <FormControl>
                                  <Input placeholder="Models, drawings, reports..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeSchedule(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}