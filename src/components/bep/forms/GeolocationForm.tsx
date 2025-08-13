import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Geolocation } from "@/lib/supabase"
import { Globe, MapPin } from "lucide-react"

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
  "WGS84 (World Geodetic System)",
  "UTM (Universal Transverse Mercator)",
  "Local Grid System",
  "State Plane Coordinate System",
  "Other"
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

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as GeolocationFormData)
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate])

  const isGeoreferenced = form.watch("is_georeferenced")

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Project Georeferencing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="is_georeferenced"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Will the project be georeferenced?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ? "true" : "false"}
                      onValueChange={(value) => field.onChange(value === "true")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="geo-yes" />
                        <Label htmlFor="geo-yes">Yes - Use real-world coordinates</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="geo-no" />
                        <Label htmlFor="geo-no">No - Use local coordinates only</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {isGeoreferenced && (
              <>
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coordinate_setup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordinate Setup Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe coordinate setup process and parameters"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="origin_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Origin Strategy</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe project origin, base points, and shared coordinates"
                          {...field} 
                        />
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