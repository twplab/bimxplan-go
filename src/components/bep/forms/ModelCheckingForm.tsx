import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ModelChecking } from "@/lib/supabase"
import { Search, Users } from "lucide-react"

const modelCheckingSchema = z.object({
  clash_detection_tools: z.array(z.string()).min(1, "At least one tool is required"),
  coordination_process: z.string(),
  meeting_frequency: z.string(),
  responsibility_matrix: z.string(),
})

type ModelCheckingFormData = z.infer<typeof modelCheckingSchema>

interface ModelCheckingFormProps {
  data?: Partial<ModelChecking>
  onUpdate: (data: ModelCheckingFormData) => void
}

const CLASH_TOOLS = [
  "Navisworks Manage",
  "Autodesk BIM 360 Model Coordination",
  "Solibri Model Checker",
  "Trimble Connect",
  "BIMcollab",
  "Other"
]

const MEETING_FREQUENCIES = [
  "Daily",
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Per Milestone",
  "As Needed"
]

export function ModelCheckingForm({ data, onUpdate }: ModelCheckingFormProps) {
  const form = useForm<ModelCheckingFormData>({
    resolver: zodResolver(modelCheckingSchema),
    defaultValues: {
      clash_detection_tools: data?.clash_detection_tools || [],
      coordination_process: data?.coordination_process || "",
      meeting_frequency: data?.meeting_frequency || "",
      responsibility_matrix: data?.responsibility_matrix || "",
    },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as ModelCheckingFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  const selectedTools = form.watch("clash_detection_tools")

  const handleToolChange = (tool: string, checked: boolean) => {
    const currentTools = selectedTools || []
    if (checked) {
      form.setValue("clash_detection_tools", [...currentTools, tool])
    } else {
      form.setValue("clash_detection_tools", currentTools.filter(t => t !== tool))
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Clash Detection & Quality Control</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="clash_detection_tools"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clash Detection Tools (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {CLASH_TOOLS.map((tool) => (
                      <div key={tool} className="flex items-center space-x-2">
                        <Checkbox
                          id={tool}
                          checked={selectedTools?.includes(tool) || false}
                          onCheckedChange={(checked) => handleToolChange(tool, checked as boolean)}
                        />
                        <label htmlFor={tool} className="text-sm font-medium cursor-pointer">
                          {tool}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meeting_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordination Meeting Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEETING_FREQUENCIES.map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {frequency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coordination_process"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordination Workflow</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe model coordination process, clash resolution workflow, issue tracking..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsibility_matrix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsibility Matrix</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Define responsibilities for clash detection runs, issue resolution, model quality checks..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}