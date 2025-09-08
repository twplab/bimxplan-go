import React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectOverview } from "@/lib/supabase"
import { Plus, Trash2 } from "lucide-react"

const projectOverviewSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  location: z.string().min(1, "Location is required"),
  client_name: z.string().min(1, "Client name is required"),
  project_type: z.string().min(1, "Project type is required"),
  description: z.string().optional(),
  key_milestones: z.array(z.object({
    name: z.string(),
    date: z.string(),
    description: z.string().optional(),
  })),
})

type ProjectOverviewFormData = z.infer<typeof projectOverviewSchema>

interface ProjectOverviewFormProps {
  data?: Partial<ProjectOverview>
  onUpdate: (data: ProjectOverviewFormData) => void
}

const PROJECT_TYPES = [
  "Residential Building",
  "Commercial Office",
  "Mixed-Use Development",
  "Educational Facility",
  "Healthcare Facility",
  "Industrial Building",
  "Infrastructure",
  "Renovation/Retrofit",
  "Other"
]

export function ProjectOverviewForm({ data, onUpdate }: ProjectOverviewFormProps) {
  const form = useForm<ProjectOverviewFormData>({
    resolver: zodResolver(projectOverviewSchema),
    defaultValues: {
      project_name: data?.project_name || "",
      location: data?.location || "",
      client_name: data?.client_name || "",
      project_type: data?.project_type || "",
      key_milestones: data?.key_milestones || [
        { name: "Project Start", date: "", description: "" },
        { name: "Design Development", date: "", description: "" },
        { name: "Tender Documents", date: "", description: "" },
        { name: "Project Handover", date: "", description: "" },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "key_milestones",
  })

  const onSubmit = (values: ProjectOverviewFormData) => {
    onUpdate(values)
  }

  // Auto-submit on field changes
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as ProjectOverviewFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  const addMilestone = () => {
    append({ name: "", date: "", description: "" })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Project Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Client organization" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Key Milestones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Key Milestones</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.watch("key_milestones")?.map((_, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`key_milestones.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Milestone Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Design Development" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`key_milestones.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Date</FormLabel>
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
                      name={`key_milestones.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description" {...field} />
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
                      onClick={() => remove(index)}
                      disabled={form.watch("key_milestones")?.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}