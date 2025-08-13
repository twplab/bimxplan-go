import React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { OutputsDeliverables } from "@/lib/supabase"
import { Plus, Trash2, FileArchive, Calendar, Package } from "lucide-react"

const outputsDeliverablesSchema = z.object({
  deliverables_by_phase: z.array(z.object({
    phase: z.string().min(1, "Phase is required"),
    deliverables: z.array(z.string()),
    formats: z.array(z.string()),
    responsibility: z.string(),
  })),
  formats_standards: z.array(z.string()),
  milestone_schedule: z.array(z.object({
    milestone: z.string().min(1, "Milestone is required"),
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
  "Bidding/Tender",
  "Construction Administration",
  "Project Closeout"
]

const FILE_FORMATS = [
  "IFC",
  "BCF", 
  "PDF",
  "DWG",
  "RVT",
  "NWD",
  "3D PDF",
  "COBie",
  "Excel"
]

const COMMON_DELIVERABLES = [
  "3D BIM Model",
  "2D Drawings",
  "Clash Detection Report", 
  "Quantity Takeoffs",
  "4D Schedule Model",
  "Equipment Schedules",
  "As-Built Models"
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

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } = useFieldArray({
    control: form.control,
    name: "milestone_schedule",
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as OutputsDeliverablesFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  const selectedFormats = form.watch("formats_standards")

  const handleFormatChange = (format: string, checked: boolean) => {
    const currentFormats = selectedFormats || []
    if (checked) {
      form.setValue("formats_standards", [...currentFormats, format])
    } else {
      form.setValue("formats_standards", currentFormats.filter(f => f !== format))
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* File Formats & Standards */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileArchive className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">File Formats & Standards</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="formats_standards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required File Formats</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    {FILE_FORMATS.map((format) => (
                      <div key={format} className="flex items-center space-x-2">
                        <Checkbox
                          id={format}
                          checked={selectedFormats?.includes(format) || false}
                          onCheckedChange={(checked) => handleFormatChange(format, checked as boolean)}
                        />
                        <label htmlFor={format} className="text-sm font-medium cursor-pointer">
                          {format}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Deliverables by Phase */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Deliverables by Project Phase</CardTitle>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => appendPhase({ phase: "", deliverables: [], formats: [], responsibility: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Phase
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phaseFields.map((field, index) => (
                <Card key={field.id} className="border-2 border-dashed border-muted">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h4 className="text-sm font-medium">Phase {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePhase(index)}
                      disabled={phaseFields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`deliverables_by_phase.${index}.phase`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Phase</FormLabel>
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
                        name={`deliverables_by_phase.${index}.responsibility`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsible Party</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Lead Architect, All Teams" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`deliverables_by_phase.${index}.deliverables`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deliverables</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {COMMON_DELIVERABLES.map((deliverable) => (
                              <div key={deliverable} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${index}-${deliverable}`}
                                  checked={field.value?.includes(deliverable) || false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, deliverable])
                                    } else {
                                      field.onChange(current.filter(d => d !== deliverable))
                                    }
                                  }}
                                />
                                <label htmlFor={`${index}-${deliverable}`} className="text-sm cursor-pointer">
                                  {deliverable}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Milestone Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Milestone Delivery Schedule</CardTitle>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => appendMilestone({ milestone: "", deadline: "", deliverables: [] })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {milestoneFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No milestones defined. Click "Add Milestone" to schedule key deliverable dates.
              </p>
            ) : (
              <div className="space-y-4">
                {milestoneFields.map((field, index) => (
                  <Card key={field.id} className="border-2 border-dashed border-muted">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`milestone_schedule.${index}.milestone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Milestone</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 50% Design Review" {...field} />
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
                                  <Input 
                                    placeholder="List main deliverables" 
                                    value={field.value?.join(', ') || ''} 
                                    onChange={(e) => field.onChange(e.target.value.split(', ').filter(Boolean))} 
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeMilestone(index)}
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