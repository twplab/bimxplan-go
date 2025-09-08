import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Building, Settings, FileText, Users, Zap, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SimpleSettingsButton } from "@/components/SimpleSettingsButton";
import { Link, useNavigate } from "react-router-dom";
const logoImage = "/lovable-uploads/b3298753-472d-4926-bba6-5c04d5980343.png";

export function BIMxPlanHero() {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity cursor-pointer"
              title="Back to Home"
            >
              <img 
                src={logoImage} 
                alt="BIMxPlan Go" 
                className="h-12 w-12 md:h-10 md:w-10 object-contain bg-transparent" 
              />
              <span className="text-xl font-bold text-foreground">BIMxPlan Go</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-6">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            </nav>
            <div className="flex items-center space-x-2">
              <SimpleSettingsButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Forge your BIM path —{" "}
                <span className="text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">
                  the lean way.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Quickly generate smart BIM Execution Plans tailored to your project.
              </p>
              <div className="flex space-x-4">
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90" onClick={() => navigate('/auth')}>
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate('/bep-form')}>
                  Try Demo
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-border/20">
                <div className="bg-card rounded-lg p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Project Type</p>
                        <p className="text-sm text-muted-foreground">Commercial Office Building</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">Team Size</p>
                        <p className="text-sm text-muted-foreground">8-12 professionals</p>
                      </div>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3 mt-4">
                      <p className="text-sm font-medium text-primary">✓ Plan Generated Successfully</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to your custom BIM execution plan</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Define Your Project</h3>
                <p className="text-muted-foreground">Describe scope, roles, goals</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-transparent hover:border-accent/20 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Settings className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-4">Pick Your Tools</h3>
                <p className="text-muted-foreground">Choose software, formats</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Get Plan</h3>
                <p className="text-muted-foreground">Expert QD/y MonuForm instantly</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why BIMxPlan Go */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why BIMxPlan Go</h2>
          </div>

          <div className="space-y-20">
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-foreground">No jargon. Just action.</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Describe scope, roles, goals without getting bogged down in complex terminology or bureaucratic processes.
                </p>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-border/20">
                <div className="bg-card rounded-lg p-6 shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Define Your Project</span>
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded p-3 text-sm">
                      <div className="space-y-2">
                        <div>• Project Type: Office Building</div>
                        <div>• Team: Architect, Structural, MEP</div>
                        <div>• Timeline: 12 months</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">✓ Clear, actionable inputs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl p-8 border border-border/20">
                  <div className="bg-card rounded-lg p-6 shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Tailored to real AEC workflows</span>
                        <Building className="h-4 w-4 text-accent" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted rounded p-2">Design Phase</div>
                        <div className="bg-muted rounded p-2">Coordination</div>
                        <div className="bg-muted rounded p-2">Documentation</div>
                        <div className="bg-muted rounded p-2">Handover</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <h3 className="text-3xl font-bold text-foreground">Tailored to real AEC workflows</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Built specifically for architecture, engineering, and construction teams working on practical, real-world projects.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-foreground">ISO-free, lightweight execution</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Skip the heavy standards and bureaucracy. Get straight to implementation with lean, actionable plans.
                </p>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-border/20">
                <div className="bg-card rounded-lg p-6 shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Export Options</span>
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-primary/10 rounded p-3 text-center text-sm">
                        <FileText className="h-4 w-4 mx-auto mb-1 text-primary" />
                        PDF
                      </div>
                      <div className="bg-accent/10 rounded p-3 text-center text-sm">
                        <FileText className="h-4 w-4 mx-auto mb-1 text-accent" />
                        Markdown
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            All the essentials to kickstart your BIM execution—without the complexity.
          </h2>
          <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90" onClick={() => navigate('/auth')}>
            Start Building Your BEP
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 hover:opacity-90 transition-opacity cursor-pointer"
                title="Back to Home"
              >
                <img 
                  src={logoImage} 
                  alt="BIMxPlan Go" 
                  className="h-8 w-8 object-contain bg-transparent" 
                />
                <span className="font-semibold text-foreground">BIMxPlan Go</span>
              </button>
            </div>
            <nav className="flex space-x-6">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}