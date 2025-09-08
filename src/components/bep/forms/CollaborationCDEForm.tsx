import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CollaborationCDE } from "@/lib/supabase"
import { Cloud } from "lucide-react"

const collaborationCDESchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  file_linking_method: z.string(),
  sharing_frequency: z.string(),
  setup_responsibility: z.string(),
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
  "Other"
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

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as CollaborationCDEFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Common Data Environment (CDE)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CDE Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select CDE platform" />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="file_linking_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Linking Method</FormLabel>
                  <FormControl>
                    <Input placeholder="Direct linking, copy/paste, etc." {...field} />
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