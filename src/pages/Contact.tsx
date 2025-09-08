import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail } from "lucide-react"
import { Link } from "react-router-dom"

const Contact = () => {
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
            <CardTitle className="text-center text-2xl">Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed mb-6 text-center">
              We'd love to hear from you.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              For support, feedback, partnership opportunities, or press inquiries, please reach out to:
            </p>
            
            <div className="flex items-center justify-center space-x-3 mb-6 p-6 bg-muted/30 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
              <a 
                href="mailto:team@twplab.org" 
                className="text-xl font-semibold text-primary hover:underline"
              >
                team@twplab.org
              </a>
            </div>
            
            <p className="text-lg leading-relaxed text-center">
              We'll get back to you within 1–2 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Contact