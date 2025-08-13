import React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamResponsibilities } from "@/lib/supabase"
import { Plus, Trash2, Users } from "lucide-react"

const teamResponsibilitiesSchema = z.object({
  firms: z.array(z.object({
    name: z.string().min(1, "Firm name is required"),
    discipline: z.string().min(1, "Discipline is required"),
    bim_lead: z.string().min(1, "BIM lead is required"),
    contact_info: z.string().min(1, "Contact info is required"),
  })),
})

type TeamResponsibilitiesFormData = z.infer<typeof teamResponsibilitiesSchema>

interface TeamResponsibilitiesFormProps {
  data?: Partial<TeamResponsibilities>
  onUpdate: (data: TeamResponsibilitiesFormData) => void
}

const DISCIPLINES = [
  "Architecture",
  "Structural Engineering",
  "MEP Engineering",
  "Civil Engineering",
  "Landscape Architecture",
  "Interior Design",
  "Facade Engineering",
  "Fire Safety",
  "Acoustic Engineering",
  "Project Management",
  "Other"
]

export function TeamResponsibilitiesForm({ data, onUpdate }: TeamResponsibilitiesFormProps) {
  const form = useForm<TeamResponsibilitiesFormData>({
    resolver: zodResolver(teamResponsibilitiesSchema),
    defaultValues: {
      firms: data?.firms || [
        { name: "", discipline: "", bim_lead: "", contact_info: "" }
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "firms",
  })

  const onSubmit = (values: TeamResponsibilitiesFormData) => {
    onUpdate(values)
  }

  // Auto-submit on field changes
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as TeamResponsibilitiesFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  const addFirm = () => {
    append({ name: "", discipline: "", bim_lead: "", contact_info: "" })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Team Firms & Responsibilities</CardTitle>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addFirm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Firm
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-2 border-dashed border-muted">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h4 className="text-sm font-medium">Firm {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`firms.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Firm Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., ABC Architecture Studio" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`firms.${index}.discipline`}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`firms.${index}.bim_lead`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BIM Lead</FormLabel>
                            <FormControl>
                              <Input placeholder="Name of BIM coordinator" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`firms.${index}.contact_info`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Information</FormLabel>
                            <FormControl>
                              <Input placeholder="Email or phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}