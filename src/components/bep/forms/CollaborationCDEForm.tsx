import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CollaborationCDE } from "@/lib/supabase"
import { Cloud, Share, Users } from "lucide-react"

const collaborationCDESchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  file_linking_method: z.string().min(1, "File linking method is required"),
  sharing_frequency: z.string().min(1, "Sharing frequency is required"),
  setup_responsibility: z.string().min(1, "Setup responsibility is required"),
  access_controls: z.string(),
})

type CollaborationCDEFormData = z.infer<typeof collaborationCDESchema>

interface CollaborationCDEFormProps {
  data?: Partial<CollaborationCDE>
  onUpdate: (data: CollaborationCDEFormData) => void
}

const CDE_PLATFORMS = [
  "Autodesk Construction Cloud (ACC)",
  "BIM 360",
  "Trimble Connect",
  "Bentley ProjectWise",
  "Dropbox",
  "SharePoint",
  "Box",
  "Google Drive",
  "Custom FTP",
  "Other"
]

const LINKING_METHODS = [
  "Shared (Work-shared)",
  "Consumed (Links only)",
  "Hybrid (Mix of shared and consumed)",
  "Copy/Sync Method"
]

const SHARING_FREQUENCIES = [
  "Daily",
  "Twice daily (Morning/Evening)",
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "As needed",
  "Milestone-based"
]

export function CollaborationCDEForm({ data, onUpdate }: CollaborationCDEFormProps) {
  const form = useForm<CollaborationCDEFormData>({
    resolver: zodResolver(collaborationCDESchema),
    defaultValues: {
      platform: data?.platform || "",
      file_linking_method: data?.file_linking_method || "",
      sharing_frequency: data?.sharing_frequency || "",
      setup_responsibility: data?.setup_responsibility || "",
      access_controls: data?.access_controls || "",
    },
  })

  const onSubmit = (values: CollaborationCDEFormData) => {
    onUpdate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Common Data Environment (CDE)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Selection */}
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CDE Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select collaboration platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CDE_PLATFORMS.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Primary platform for file sharing and collaboration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Linking Method */}
            <FormField
              control={form.control}
              name="file_linking_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Linking Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select linking method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LINKING_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How models will be linked between disciplines
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Sharing Frequency */}
              <FormField
                control={form.control}
                name="sharing_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Sharing Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SHARING_FREQUENCIES.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {frequency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Setup Responsibility */}
              <FormField
                control={form.control}
                name="setup_responsibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform Setup Responsibility</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lead Architect, BIM Manager" {...field} />
                    </FormControl>
                    <FormDescription>
                      Who is responsible for CDE setup and administration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Access Controls */}
            <FormField
              control={form.control}
              name="access_controls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Controls & Permissions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe user roles, permissions, and access restrictions for different team members and project phases"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Define who has access to what files and when
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Collaboration Workflow */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Share className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Collaboration Workflow</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium">Create & Work</h4>
                <p className="text-sm text-muted-foreground">
                  Teams create and develop models in their native software
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-12 w-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                  <Share className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-medium">Share & Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Regular uploads to CDE according to sharing frequency
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
                  <Cloud className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium">Coordinate</h4>
                <p className="text-sm text-muted-foreground">
                  Link and coordinate models for clash detection and review
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}