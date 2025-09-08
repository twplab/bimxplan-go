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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ModelingScope } from "@/lib/supabase"
import { Plus, Trash2, Layers } from "lucide-react"

const modelingScopeSchema = z.object({
  general_lod: z.string().min(1, "General LOD is required"),
  discipline_lods: z.array(z.object({
    discipline: z.string().min(1, "Discipline is required"),
    lod_level: z.string().min(1, "LOD level is required"),
    description: z.string(),
  })),
  exceptions: z.array(z.object({
    value: z.string()
  })),
  units: z.string().min(1, "Units are required"),
  levels_grids_strategy: z.string().min(1, "Strategy is required"),
})

type ModelingScopeFormData = z.infer<typeof modelingScopeSchema>

interface ModelingScopeFormProps {
  data?: Partial<ModelingScope>
  onUpdate: (data: ModelingScopeFormData) => void
}

const LOD_LEVELS = ["LOD 100", "LOD 200", "LOD 300", "LOD 350", "LOD 400", "LOD 500"]
const DISCIPLINES = ["Architecture", "Structural", "MEP", "Civil", "Landscape"]
const UNITS = ["Millimeters", "Meters", "Feet/Inches", "Inches"]

export function ModelingScopeForm({ data, onUpdate }: ModelingScopeFormProps) {
  const form = useForm<ModelingScopeFormData>({
    resolver: zodResolver(modelingScopeSchema),
    defaultValues: {
      general_lod: data?.general_lod || "",
      discipline_lods: data?.discipline_lods || [
        { discipline: "Architecture", lod_level: "", description: "" },
        { discipline: "Structural", lod_level: "", description: "" },
        { discipline: "MEP", lod_level: "", description: "" },
      ],
      exceptions: data?.exceptions ? data.exceptions.map(ex => ({ value: ex })) : [],
      units: data?.units || "",
      levels_grids_strategy: data?.levels_grids_strategy || "",
    },
  })

  const { fields: lodFields, append: appendLOD, remove: removeLOD } = useFieldArray({
    control: form.control,
    name: "discipline_lods",
  })

  const { fields: exceptionFields, append: appendException, remove: removeException } = useFieldArray({
    control: form.control,
    name: "exceptions",
  })

  const onSubmit = (values: ModelingScopeFormData) => {
    onUpdate(values)
  }

  // Auto-submit on field changes
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as ModelingScopeFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">General Modeling Parameters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="general_lod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General LOD</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select general LOD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOD_LEVELS.map((lod) => (
                          <SelectItem key={lod} value={lod}>
                            {lod}
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
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Units</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select units" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="levels_grids_strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Levels, Grids & Datum Strategy</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe how levels, grids, and datum elements will be managed (e.g., separate datum model, shared coordinates)"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Discipline-Specific LODs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Discipline-Specific LODs</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendLOD({ discipline: "", lod_level: "", description: "" })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Discipline
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lodFields.map((field, index) => (
                <Card key={field.id} className="border-2 border-dashed border-muted">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                      <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                        <FormField
                          control={form.control}
                          name={`discipline_lods.${index}.discipline`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discipline</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select discipline" />
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
                      <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`discipline_lods.${index}.lod_level`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LOD Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="LOD" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LOD_LEVELS.map((lod) => (
                                    <SelectItem key={lod} value={lod}>
                                      {lod}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 lg:col-span-6">
                        <FormField
                          control={form.control}
                          name={`discipline_lods.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description/Notes</FormLabel>
                              <FormControl>
                                <Input placeholder="Specific requirements or exceptions" {...field} />
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
                          onClick={() => removeLOD(index)}
                          disabled={lodFields.length <= 1}
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

        {/* Exceptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Modeling Exceptions</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendException({ value: "" })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Exception
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {exceptionFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No exceptions defined. Click "Add Exception" to specify elements that won't follow standard LOD.
              </p>
            ) : (
              <div className="space-y-3">
                {exceptionFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name={`exceptions.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g., Facade elements not modeled in detail" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeException(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}