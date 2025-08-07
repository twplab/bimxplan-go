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
import { ModelChecking } from "@/lib/supabase"
import { Plus, Trash2, Search, AlertTriangle } from "lucide-react"

const modelCheckingSchema = z.object({
  clash_detection_tools: z.array(z.string()),
  coordination_process: z.string().min(1, "Coordination process is required"),
  meeting_frequency: z.string().min(1, "Meeting frequency is required"),
  responsibility_matrix: z.string(),
})

type ModelCheckingFormData = z.infer<typeof modelCheckingSchema>

interface ModelCheckingFormProps {
  data?: Partial<ModelChecking>
  onUpdate: (data: ModelCheckingFormData) => void
}

const CLASH_DETECTION_TOOLS = [
  "Navisworks Manage",
  "Navisworks Freedom",
  "Autodesk Construction Cloud Model Coordination",
  "Solibri Model Checker",
  "BIMcollab ZOOM",
  "Tekla BIMsight",
  "Trimble Connect",
  "Other"
]

const MEETING_FREQUENCIES = [
  "Daily",
  "Twice weekly",
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Before major milestones",
  "As needed"
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

  const onSubmit = (values: ModelCheckingFormData) => {
    onUpdate(values)
  }

  const selectedTools = form.watch("clash_detection_tools")

  const toggleTool = (tool: string) => {
    const current = selectedTools || []
    const updated = current.includes(tool)
      ? current.filter(t => t !== tool)
      : [...current, tool]
    form.setValue("clash_detection_tools", updated)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Model Checking & Clash Detection</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clash Detection Tools */}
            <div className="space-y-4">
              <FormLabel>Clash Detection Tools</FormLabel>
              <FormDescription>
                Select the software tools that will be used for model coordination and clash detection
              </FormDescription>
              
              <div className="grid grid-cols-2 gap-3">
                {CLASH_DETECTION_TOOLS.map((tool) => (
                  <div key={tool} className="flex items-center space-x-2">
                    <Checkbox
                      id={tool}
                      checked={selectedTools?.includes(tool) || false}
                      onCheckedChange={() => toggleTool(tool)}
                    />
                    <label 
                      htmlFor={tool}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {tool}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Frequency */}
            <FormField
              control={form.control}
              name="meeting_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordination Meeting Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meeting frequency" />
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
                  <FormDescription>
                    How often the team will meet to review coordination issues
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Coordination Process */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Coordination Process</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="coordination_process"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordination Workflow</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the step-by-step process for model coordination, including who runs clash detection, how issues are reported, resolution workflow, and verification process"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Define the complete workflow from clash detection to resolution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsibility_matrix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsibility Matrix (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Define who is responsible for different types of coordination issues (e.g., Structural vs MEP clashes resolved by Structural Engineer, MEP vs Architecture resolved by Architect, etc.)"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Clarify responsibility for resolving different types of coordination issues
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Coordination Workflow Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Typical Coordination Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <h4 className="font-medium text-sm">Model Upload</h4>
                <p className="text-xs text-muted-foreground">
                  Teams upload latest models to CDE
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-12 w-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-accent">2</span>
                </div>
                <h4 className="font-medium text-sm">Clash Detection</h4>
                <p className="text-xs text-muted-foreground">
                  Run automated clash detection
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <h4 className="font-medium text-sm">Issue Resolution</h4>
                <p className="text-xs text-muted-foreground">
                  Coordinate and resolve conflicts
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-12 w-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-accent">4</span>
                </div>
                <h4 className="font-medium text-sm">Verification</h4>
                <p className="text-xs text-muted-foreground">
                  Verify fixes and update models
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}