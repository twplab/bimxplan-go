import React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { FileNaming } from "@/lib/supabase"
import { Plus, Trash2, File } from "lucide-react"

const fileNamingSchema = z.object({
  use_conventions: z.boolean(),
  prefix_format: z.string(),
  discipline_codes: z.string(),
  versioning_format: z.string(),
  examples: z.array(z.object({ value: z.string() })),
})

type FileNamingFormData = z.infer<typeof fileNamingSchema>

interface FileNamingFormProps {
  data?: Partial<FileNaming>
  onUpdate: (data: FileNamingFormData) => void
}

export function FileNamingForm({ data, onUpdate }: FileNamingFormProps) {
  const form = useForm<FileNamingFormData>({
    resolver: zodResolver(fileNamingSchema),
    defaultValues: {
      use_conventions: data?.use_conventions ?? true,
      prefix_format: data?.prefix_format || "PRJ-DIS-ZON-TYP-###-VER",
      discipline_codes: data?.discipline_codes || "AR (Architecture), ST (Structural), ME (MEP)",
      versioning_format: data?.versioning_format || "V01, V02, V03",
      examples: data?.examples ? data.examples.map(ex => ({ value: ex })) : [{ value: "ABC-AR-L01-MDL-001-V01" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "examples",
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as FileNamingFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">File Naming Strategy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="use_conventions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use Standardized File Naming?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ? "true" : "false"}
                      onValueChange={(value) => field.onChange(value === "true")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="yes" />
                        <Label htmlFor="yes">Yes - Use standard conventions</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="no" />
                        <Label htmlFor="no">No - Teams use own conventions</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch("use_conventions") && (
              <>
                <FormField
                  control={form.control}
                  name="prefix_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name Format</FormLabel>
                      <FormControl>
                        <Input placeholder="PRJ-DIS-ZON-TYP-###-VER" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discipline_codes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discipline Codes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="AR (Architecture), ST (Structural)..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}