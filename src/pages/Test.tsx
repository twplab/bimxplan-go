import React from 'react';
import { AppDiagnostics } from '@/components/AppDiagnostics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Bug, Settings } from 'lucide-react';
import { SimpleSettingsButton } from '@/components/SimpleSettingsButton';
import { useNavigate } from 'react-router-dom';

export default function Test() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bug className="h-6 w-6" />
              BIMxPlan Go - System Diagnostics & Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                ✅ React is working! If you can see this page, the core application is rendering correctly.
                Use the diagnostics below to check all system components.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/')} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Back to Main App
              </Button>
              
              <SimpleSettingsButton variant="outline" showText={true} />
              
              <Button 
                variant="outline" 
                onClick={() => console.log('Console test - check F12 DevTools')}
              >
                Test Console
              </Button>
            </div>
          </CardContent>
        </Card>

        <AppDiagnostics />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manual Testing Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">🔍 Visual Tests</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Check if all pages load without blank screens</li>
                    <li>• Test theme switching (Light/Dark/System)</li>
                    <li>• Verify ChatBot appears and is draggable</li>
                    <li>• Test responsive design on mobile</li>
                    <li>• Check logo navigation to landing page</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">⚙️ Functional Tests</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Create and edit BEP projects</li>
                    <li>• Test PDF export functionality</li>
                    <li>• Verify settings persist after refresh</li>
                    <li>• Test authentication flow</li>
                    <li>• Check form validation and error handling</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}