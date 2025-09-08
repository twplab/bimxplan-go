import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center space-x-3 mb-6">
              <img 
                src="/lovable-uploads/b3298753-472d-4926-bba6-5c04d5980343.png" 
                alt="BIMxPlan Go" 
                className="h-12 w-12 object-contain bg-transparent" 
              />
              <span className="text-3xl font-bold">BIMxPlan Go</span>
            </div>
            <CardTitle className="text-center text-2xl">Terms of Use</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg leading-relaxed">
              BIMxPlan Go is provided "as is" without warranties of any kind.
            </p>
            
            <p className="text-lg leading-relaxed">
              By using this app, you agree to use it for professional, lawful purposes only. We do not take responsibility for project outcomes based on generated content.
            </p>
            
            <p className="text-lg leading-relaxed">
              All data you enter remains private unless explicitly shared.
            </p>
            
            <p className="text-lg leading-relaxed">
              BIMxPlan Go™ is a trademark of TWP Lab. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Terms