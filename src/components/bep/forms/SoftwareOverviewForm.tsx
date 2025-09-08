import React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { SoftwareOverview } from "@/lib/supabase"
import { Plus, Trash2, Settings } from "lucide-react"

const softwareOverviewSchema = z.object({
  main_tools: z.array(z.object({
    name: z.string().min(1, "Software name is required"),
    version: z.string(),
    discipline: z.string(),
    usage: z.string(),
  })),
  team_specific_tools: z.array(z.object({
    name: z.string().min(1, "Software name is required"),
    version: z.string(),
    discipline: z.string(),
    usage: z.string(),
  })),
})

type SoftwareOverviewFormData = z.infer<typeof softwareOverviewSchema>

interface SoftwareOverviewFormProps {
  data?: Partial<SoftwareOverview>
  onUpdate: (data: SoftwareOverviewFormData) => void
}

const BIM_SOFTWARE = [
  "Autodesk Revit",
  "ArchiCAD",
  "Tekla Structures",
  "Bentley MicroStation",
  "Rhinoceros 3D",
  "SketchUp",
  "AutoCAD",
  "Navisworks",
  "Solibri Model Checker",
  "BIM 360",
  "Trimble Connect",
  "Other"
]

const DISCIPLINES = [
  "Architecture",
  "Structural",
  "MEP",
  "Civil",
  "Coordination",
  "Analysis",
  "Visualization",
  "General"
]

export function SoftwareOverviewForm({ data, onUpdate }: SoftwareOverviewFormProps) {
  const form = useForm<SoftwareOverviewFormData>({
    resolver: zodResolver(softwareOverviewSchema),
    defaultValues: {
      main_tools: data?.main_tools || [
        { name: "", version: "", discipline: "", usage: "" }
      ],
      team_specific_tools: data?.team_specific_tools || [],
    },
  })

  const { fields: mainToolsFields, append: appendMainTool, remove: removeMainTool } = useFieldArray({
    control: form.control,
    name: "main_tools",
  })

  const { fields: teamToolsFields, append: appendTeamTool, remove: removeTeamTool } = useFieldArray({
    control: form.control,
    name: "team_specific_tools",
  })

  const onSubmit = (values: SoftwareOverviewFormData) => {
    onUpdate(values)
  }

  // Auto-submit on field changes
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as SoftwareOverviewFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  const addMainTool = () => {
    appendMainTool({ name: "", version: "", discipline: "", usage: "" })
  }

  const addTeamTool = () => {
    appendTeamTool({ name: "", version: "", discipline: "", usage: "" })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Main BIM Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Main BIM Software</CardTitle>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addMainTool}>
                <Plus className="h-4 w-4 mr-2" />
                Add Software
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mainToolsFields.map((field, index) => (
                <Card key={field.id} className="border-2 border-dashed border-muted">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                      <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                        <FormField
                          control={form.control}
                          name={`main_tools.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Software</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select software" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BIM_SOFTWARE.map((software) => (
                                    <SelectItem key={software} value={software}>
                                      {software}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`main_tools.${index}.version`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Version</FormLabel>
                              <FormControl>
                                <Input placeholder="2024, 2025" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`main_tools.${index}.discipline`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discipline</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DISCIPLINES.map((discipline) => (
                                    <SelectItem key={discipline} value={discipline}>
                                      {discipline}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                        <FormField
                          control={form.control}
                          name={`main_tools.${index}.usage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usage Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Primary modeling, coordination..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeMainTool(index)}
                          disabled={mainToolsFields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team-Specific Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Team-Specific Software</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTeamTool}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {teamToolsFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No team-specific tools added yet. Click "Add Tool" to include specialized software.
              </p>
            ) : (
              <div className="space-y-4">
                {teamToolsFields.map((field, index) => (
                  <Card key={field.id} className="border-2 border-dashed border-muted">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                        <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                          <FormField
                            control={form.control}
                            name={`team_specific_tools.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Software</FormLabel>
                                <FormControl>
                                  <Input placeholder="Custom software name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                          <FormField
                            control={form.control}
                            name={`team_specific_tools.${index}.version`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Version</FormLabel>
                                <FormControl>
                                  <Input placeholder="Version" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                          <FormField
                            control={form.control}
                            name={`team_specific_tools.${index}.discipline`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discipline</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DISCIPLINES.map((discipline) => (
                                      <SelectItem key={discipline} value={discipline}>
                                        {discipline}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                          <FormField
                            control={form.control}
                            name={`team_specific_tools.${index}.usage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Usage</FormLabel>
                                <FormControl>
                                  <Input placeholder="Specialized analysis, visualization..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeTeamTool(index)}
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