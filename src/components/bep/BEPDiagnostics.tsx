import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DiagnosticResult {
  test: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: Record<string, unknown>
}

export function BEPDiagnostics({ projectId }: { projectId?: string }) {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [running, setRunning] = useState(false)
  const { toast } = useToast()

  const runDiagnostics = async () => {
    setRunning(true)
    const testResults: DiagnosticResult[] = []

    // Test 1: Authentication
    try {
      const { data: user } = await supabase.auth.getUser()
      testResults.push({
        test: 'Authentication',
        status: user.user ? 'pass' : 'fail',
        message: user.user ? `Authenticated as ${user.user.email}` : 'Not authenticated',
        details: { userId: user.user?.id }
      })
    } catch (error) {
      testResults.push({
        test: 'Authentication',
        status: 'fail',
        message: 'Auth check failed',
        details: { error }
      })
    }

    // Test 2: Project Access (if projectId provided)
    if (projectId) {
      try {
        const { data, error } = await supabase.rpc('user_can_access_project', { project_uuid: projectId })
        testResults.push({
          test: 'Project Access',
          status: error ? 'fail' : (data ? 'pass' : 'fail'),
          message: error ? `RPC Error: ${error.message}` : (data ? 'Access granted' : 'Access denied'),
          details: { projectId, hasAccess: data, error }
        })
      } catch (error) {
        testResults.push({
          test: 'Project Access',
          status: 'fail',
          message: 'Access check failed',
          details: { error }
        })
      }
    }

    // Test 3: Project Data
    if (projectId) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id,name,project_data,owner_id')
          .eq('id', projectId)
          .maybeSingle()
        
        const hasData = data?.project_data && Object.keys(data.project_data).length > 0
        testResults.push({
          test: 'Project Data',
          status: error ? 'fail' : (hasData ? 'pass' : 'warning'),
          message: error ? `DB Error: ${error.message}` : 
                   hasData ? `Data found (${JSON.stringify(data.project_data).length} chars)` : 
                   'No project data - form needs to be filled',
          details: { data, error }
        })
      } catch (error) {
        testResults.push({
          test: 'Project Data',
          status: 'fail',
          message: 'Data fetch failed',
          details: { error }
        })
      }
    }

    // Test 4: RLS Policies
    try {
      const { data, error } = await supabase.from('projects').select('count').limit(1)
      testResults.push({
        test: 'Database Access',
        status: error ? 'fail' : 'pass',
        message: error ? `RLS/DB Error: ${error.message}` : 'Database accessible',
        details: { error }
      })
    } catch (error) {
      testResults.push({
        test: 'Database Access',
        status: 'fail',
        message: 'Database connection failed',
        details: { error }
      })
    }

    // Test 5: PDF Generation Assets
    try {
      const logoResponse = await fetch('/src/assets/bimxplan-logo.png')
      testResults.push({
        test: 'PDF Assets',
        status: logoResponse.ok ? 'pass' : 'warning',
        message: logoResponse.ok ? 'Logo accessible' : 'Logo not found - PDF will work without logo',
        details: { logoStatus: logoResponse.status }
      })
    } catch (error) {
      testResults.push({
        test: 'PDF Assets',
        status: 'warning',
        message: 'Logo check failed - PDF will work without logo',
        details: { error }
      })
    }

    setResults(testResults)
    setRunning(false)

    const failCount = testResults.filter(r => r.status === 'fail').length
    const warningCount = testResults.filter(r => r.status === 'warning').length
    
    if (failCount === 0 && warningCount === 0) {
      toast({ title: 'All Tests Passed', description: 'BEP Preview & PDF export should work correctly' })
    } else if (failCount > 0) {
      toast({ 
        title: `${failCount} Critical Issues Found`, 
        description: 'Fix critical issues before using BEP features',
        variant: 'destructive' 
      })
    } else {
      toast({ 
        title: `${warningCount} Warnings Found`, 
        description: 'BEP will work but with limitations'
      })
    }
  }

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    const variant = status === 'pass' ? 'default' : status === 'fail' ? 'destructive' : 'secondary'
    return <Badge variant={variant}>{status.toUpperCase()}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          BEP Diagnostics
          <Button variant="outline" onClick={runDiagnostics} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <Alert>
            <AlertDescription>
              Click "Run Tests" to diagnose BEP Preview & PDF export functionality.
              This will check permissions, data access, and asset availability.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium">{result.test}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              <strong>Summary:</strong>
              {' '}
              {results.filter(r => r.status === 'pass').length} passed, 
              {' '}
              {results.filter(r => r.status === 'warning').length} warnings, 
              {' '}
              {results.filter(r => r.status === 'fail').length} critical issues
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}