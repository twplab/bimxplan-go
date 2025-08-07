import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Geolocation } from "@/lib/supabase"
import { MapPin, Globe } from "lucide-react"

const geolocationSchema = z.object({
  is_georeferenced: z.boolean(),
  coordinate_setup: z.string(),
  origin_location: z.string(),
  coordinate_system: z.string(),
})

type GeolocationFormData = z.infer<typeof geolocationSchema>

interface GeolocationFormProps {
  data?: Partial<Geolocation>
  onUpdate: (data: GeolocationFormData) => void
}

const COORDINATE_SYSTEMS = [
  "WGS84 (World Geodetic System 1984)",
  "UTM (Universal Transverse Mercator)",
  "Local Grid System",
  "State Plane Coordinate System",
  "British National Grid",
  "Other"
]

const SETUP_METHODS = [
  "Survey coordinates provided",
  "GPS coordinates from site",
  "Google Earth reference",
  "Local coordinate system",
  "No georeferencing"
]

export function GeolocationForm({ data, onUpdate }: GeolocationFormProps) {
  const form = useForm<GeolocationFormData>({
    resolver: zodResolver(geolocationSchema),
    defaultValues: {
      is_georeferenced: data?.is_georeferenced ?? false,
      coordinate_setup: data?.coordinate_setup || "",
      origin_location: data?.origin_location || "",
      coordinate_system: data?.coordinate_system || "",
    },
  })

  const onSubmit = (values: GeolocationFormData) => {
    onUpdate(values)
  }

  const isGeoreferenced = form.watch("is_georeferenced")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Project Geolocation & Coordinates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Georeferencing Enable */}
            <FormField
              control={form.control}
              name="is_georeferenced"
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
                      Project is georeferenced
                    </FormLabel>
                    <FormDescription>
                      Enable if the project uses real-world coordinates and positioning
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {isGeoreferenced ? (
              <>
                {/* Coordinate Setup Method */}
                <FormField
                  control={form.control}
                  name="coordinate_setup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordinate Setup Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select setup method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SETUP_METHODS.filter(method => method !== "No georeferencing").map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How coordinate information was obtained
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Coordinate System */}
                <FormField
                  control={form.control}
                  name="coordinate_system"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordinate System</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select coordinate system" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COORDINATE_SYSTEMS.map((system) => (
                            <SelectItem key={system} value={system}>
                              {system}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Geographic coordinate system used for the project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Origin Location */}
                <FormField
                  control={form.control}
                  name="origin_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin Location & Setup</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the project base point, survey point setup, and how coordinates relate to the physical site (e.g., 'Project base point set at building corner, Survey point matches site survey benchmark')"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Explain how the model origin relates to real-world coordinates
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Coordinate Information Display */}
                <Card className="bg-muted/30">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-medium">Georeferencing Benefits</h4>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Accurate site context and orientation</li>
                      <li>• Integration with GIS and survey data</li>
                      <li>• Proper coordination with civil engineering</li>
                      <li>• Accurate sun studies and environmental analysis</li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h4 className="font-medium text-foreground">No Georeferencing</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        Project will use local coordinate system without real-world positioning.
                        Models will be positioned relative to each other but not to actual site coordinates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}