import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FileNaming } from "@/lib/supabase"
import { Plus, Trash2, FileText } from "lucide-react"

const fileNamingSchema = z.object({
  use_conventions: z.boolean(),
  prefix_format: z.string(),
  discipline_codes: z.string(),
  versioning_format: z.string(),
  examples: z.array(z.string()),
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
      prefix_format: data?.prefix_format || "[Project]_[Discipline]_[Building/Zone]",
      discipline_codes: data?.discipline_codes || "AR = Architecture, ST = Structural, ME = MEP, CV = Civil",
      versioning_format: data?.versioning_format || "v01, v02, v03...",
      examples: data?.examples || [
        "PROJ_AR_MainBuilding_v01.rvt",
        "PROJ_ST_Tower_v02.rvt", 
        "PROJ_ME_Basement_v01.rvt"
      ],
    },
  })

  const { fields: exampleFields, append: appendExample, remove: removeExample } = useFieldArray({
    control: form.control,
    name: "examples",
  })

  const onSubmit = (values: FileNamingFormData) => {
    onUpdate(values)
  }

  const useConventions = form.watch("use_conventions")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">File Naming Conventions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Conventions */}
            <FormField
              control={form.control}
              name="use_conventions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Use standardized file naming conventions
                    </FormLabel>
                    <FormDescription>
                      Enable consistent file naming across the project team
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {useConventions && (
              <>
                {/* Prefix Format */}
                <FormField
                  control={form.control}
                  name="prefix_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefix Format</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="[Project]_[Discipline]_[Building/Zone]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Define the structure for file prefixes using brackets for variables
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Discipline Codes */}
                <FormField
                  control={form.control}
                  name="discipline_codes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discipline Codes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="AR = Architecture, ST = Structural, ME = MEP..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Define abbreviations for each discipline
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Versioning Format */}
                <FormField
                  control={form.control}
                  name="versioning_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versioning Format</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="v01, v02, v03..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        How version numbers will be formatted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Examples */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">File Name Examples</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => appendExample("")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Example
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {exampleFields.map((field, index) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name={`examples.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  placeholder="PROJECT_AR_MainBuilding_v01.rvt"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeExample(index)}
                          disabled={exampleFields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!useConventions && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>File naming conventions are disabled for this project.</p>
                <p className="text-sm">Teams will use their own naming standards.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}