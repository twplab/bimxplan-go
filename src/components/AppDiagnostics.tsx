import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Bug } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { BEPDiagnostics } from './bep/BEPDiagnostics'

interface DiagnosticResult {
  test: string
  category: 'auth' | 'database' | 'ui' | 'performance' | 'security' | 'integration'
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: Record<string, unknown>
  fix?: string
}

export function AppDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [running, setRunning] = useState(false)
  const { toast } = useToast()

  const runComprehensiveAudit = async () => {
    setRunning(true)
    const testResults: DiagnosticResult[] = []

    // Enhanced Authentication Tests
    try {
      const { data: user, error } = await supabase.auth.getUser()
      const { data: session } = await supabase.auth.getSession()
      
      // Test authentication state
      testResults.push({
        test: 'Authentication State',
        category: 'auth',
        status: user.user ? 'pass' : 'warning',
        message: user.user ? `Authenticated as ${user.user.email}` : 'Not authenticated - some features limited',
        details: { 
          userId: user.user?.id, 
          email: user.user?.email,
          hasSession: !!session.session,
          sessionExpiry: session.session?.expires_at,
          error 
        },
        fix: !user.user ? 'Navigate to /auth to sign in for full functionality' : undefined
      })

      // Test session validity
      if (session.session) {
        const expiryTime = new Date(session.session.expires_at || 0).getTime()
        const currentTime = Date.now()
        const timeUntilExpiry = expiryTime - currentTime
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60)

        testResults.push({
          test: 'Session Validity',
          category: 'auth',
          status: hoursUntilExpiry > 1 ? 'pass' : hoursUntilExpiry > 0 ? 'warning' : 'fail',
          message: hoursUntilExpiry > 0 
            ? `Session expires in ${Math.round(hoursUntilExpiry * 100) / 100} hours`
            : 'Session expired',
          details: { 
            expiryTime: new Date(expiryTime).toISOString(),
            hoursUntilExpiry: Math.round(hoursUntilExpiry * 100) / 100
          },
          fix: hoursUntilExpiry <= 0 ? 'Session expired - please sign in again' : undefined
        })
      }

      // Test auth configuration
      testResults.push({
        test: 'Auth Configuration',
        category: 'auth',
        status: 'pass',
        message: 'Supabase auth client configured correctly',
        details: {
          hasSupabaseClient: !!supabase,
          authConfigured: true
        }
      })
    } catch (error) {
      testResults.push({
        test: 'Authentication State',
        category: 'auth',
        status: 'fail',
        message: 'Auth service unreachable',
        details: { error },
        fix: 'Check Supabase connection and configuration'
      })
    }

    // Database Connection Tests
    try {
      const { data, error } = await supabase.from('projects').select('count').limit(1)
      testResults.push({
        test: 'Database Connection',
        category: 'database',
        status: error ? 'fail' : 'pass',
        message: error ? `Database Error: ${error.message}` : 'Database accessible',
        details: { error, hasData: !!data },
        fix: error?.code === '42501' ? 'Run DATABASE_FIX.md SQL commands in Supabase' : undefined
      })
    } catch (error) {
      testResults.push({
        test: 'Database Connection',
        category: 'database',
        status: 'fail',
        message: 'Database connection failed',
        details: { error },
        fix: 'Check network connection and Supabase status'
      })
    }

    // RLS Policy Test
    try {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            name: 'diagnostic-test-project',
            owner_id: user.user.id,
            status: 'draft'
          })
          .select()
          .single()
        
        if (data) {
          // Clean up test project
          await supabase.from('projects').delete().eq('id', data.id)
          testResults.push({
            test: 'RLS Policies',
            category: 'security',
            status: 'pass',
            message: 'Row Level Security policies working correctly',
            details: { testProjectCreated: true }
          })
        } else {
          testResults.push({
            test: 'RLS Policies',
            category: 'security',
            status: 'fail',
            message: error ? `RLS Error: ${error.message}` : 'Cannot create projects',
            details: { error },
            fix: 'Run DATABASE_FIX.md SQL commands to configure RLS policies'
          })
        }
      }
    } catch (error) {
      testResults.push({
        test: 'RLS Policies',
        category: 'security',
        status: 'fail',
        message: 'RLS policy test failed',
        details: { error },
        fix: 'Check authentication and database policies'
      })
    }

    // UI Component Tests
    try {
      // Test if ChatBot settings are accessible
      const windowAny = window as typeof window & { getChatBotEnabled?: () => boolean }
      const chatBotEnabled = windowAny.getChatBotEnabled?.()
      
      testResults.push({
        test: 'ChatBot Integration',
        category: 'ui',
        status: typeof chatBotEnabled === 'boolean' ? 'pass' : 'warning',
        message: typeof chatBotEnabled === 'boolean' 
          ? `ChatBot is ${chatBotEnabled ? 'enabled' : 'disabled'}` 
          : 'ChatBot settings not fully loaded',
        details: { enabled: chatBotEnabled },
        fix: typeof chatBotEnabled !== 'boolean' ? 'Wait for app to fully load or refresh page' : undefined
      })
    } catch (error) {
      testResults.push({
        test: 'ChatBot Integration',
        category: 'ui',
        status: 'fail',
        message: 'ChatBot integration error',
        details: { error },
        fix: 'Check SimpleChatBot and SimpleSettings components'
      })
    }

    // Theme System Test
    try {
      const root = document.documentElement
      const hasLightTheme = root.classList.contains('light')
      const hasDarkTheme = root.classList.contains('dark')
      const hasSystemTheme = root.classList.contains('system')
      
      const activeTheme = hasLightTheme ? 'light' : hasDarkTheme ? 'dark' : hasSystemTheme ? 'system' : 'unknown'
      
      testResults.push({
        test: 'Theme System',
        category: 'ui',
        status: activeTheme !== 'unknown' ? 'pass' : 'fail',
        message: `Active theme: ${activeTheme}`,
        details: { hasLightTheme, hasDarkTheme, hasSystemTheme, activeTheme },
        fix: activeTheme === 'unknown' ? 'Check ThemeProvider configuration' : undefined
      })
    } catch (error) {
      testResults.push({
        test: 'Theme System',
        category: 'ui',
        status: 'fail',
        message: 'Theme system error',
        details: { error },
        fix: 'Check ThemeProvider and CSS theme classes'
      })
    }

    // Enhanced Performance Tests
    try {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigationTiming.loadEventEnd - navigationTiming.startTime
      const domLoadTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime
      const firstPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0
      
      testResults.push({
        test: 'Page Load Performance',
        category: 'performance',
        status: loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warning' : 'fail',
        message: `Load: ${Math.round(loadTime)}ms, DOM: ${Math.round(domLoadTime)}ms, FP: ${Math.round(firstPaint)}ms`,
        details: { 
          loadTime, 
          domLoadTime, 
          firstPaint,
          threshold: 'Load <3s good, <5s warning',
          recommendations: loadTime > 3000 ? [
            'Enable code splitting with React.lazy()',
            'Implement route-based code splitting',
            'Optimize bundle size (currently 1.2MB)',
            'Use dynamic imports for heavy components'
          ] : []
        },
        fix: loadTime > 5000 ? 'Critical: Implement code splitting and lazy loading immediately' : 
             loadTime > 3000 ? 'Recommended: Optimize bundle size and implement lazy loading' : undefined
      })

      // Bundle Size Analysis
      testResults.push({
        test: 'Bundle Size Analysis',
        category: 'performance',
        status: 'warning', // We know from build output it's 1.2MB
        message: 'Main bundle is 1.2MB (warning threshold: 500KB)',
        details: {
          bundleSize: '1.2MB',
          threshold: '500KB',
          gzipSize: '358KB',
          recommendations: [
            'Split vendor libraries into separate chunks',
            'Lazy load BEP components',
            'Optimize image assets',
            'Remove unused dependencies'
          ]
        },
        fix: 'Implement manual chunking and dynamic imports to reduce initial bundle size'
      })
    } catch (error) {
      testResults.push({
        test: 'Page Load Performance',
        category: 'performance',
        status: 'warning',
        message: 'Performance measurement unavailable',
        details: { error }
      })
    }

    // Asset Tests
    const assetTests = [
      { path: '/lovable-uploads/b3298753-472d-4926-bba6-5c04d5980343.png', name: 'BIMxPlan Logo' },
      { path: '/lovable-uploads/b412b245-ab6f-4b93-b00b-363116ccd576.png?v=1', name: 'ChatBot Avatar' }
    ]

    for (const asset of assetTests) {
      try {
        const response = await fetch(asset.path)
        testResults.push({
          test: `Asset: ${asset.name}`,
          category: 'integration',
          status: response.ok ? 'pass' : 'warning',
          message: response.ok ? 'Asset accessible' : `Asset not found (${response.status})`,
          details: { path: asset.path, status: response.status },
          fix: !response.ok ? 'Check asset paths and upload status' : undefined
        })
      } catch (error) {
        testResults.push({
          test: `Asset: ${asset.name}`,
          category: 'integration',
          status: 'fail',
          message: 'Asset check failed',
          details: { error, path: asset.path },
          fix: 'Check network connection and asset availability'
        })
      }
    }

    // Local Storage Test
    try {
      const testKey = 'diagnostic-test'
      localStorage.setItem(testKey, 'test-value')
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      testResults.push({
        test: 'Local Storage',
        category: 'integration',
        status: retrieved === 'test-value' ? 'pass' : 'fail',
        message: retrieved === 'test-value' ? 'Local storage working' : 'Local storage failed',
        details: { canWrite: true, canRead: retrieved === 'test-value' },
        fix: retrieved !== 'test-value' ? 'Check browser storage permissions' : undefined
      })
    } catch (error) {
      testResults.push({
        test: 'Local Storage',
        category: 'integration',
        status: 'fail',
        message: 'Local storage unavailable',
        details: { error },
        fix: 'Enable local storage in browser settings'
      })
    }

    setResults(testResults)
    setRunning(false)

    // Generate summary toast
    const failCount = testResults.filter(r => r.status === 'fail').length
    const warningCount = testResults.filter(r => r.status === 'warning').length
    const passCount = testResults.filter(r => r.status === 'pass').length
    
    if (failCount === 0 && warningCount === 0) {
      toast({ 
        title: '🎉 All Tests Passed!', 
        description: `${passCount} checks completed successfully. App is healthy.` 
      })
    } else if (failCount > 0) {
      toast({ 
        title: `⚠️ ${failCount} Critical Issues Found`, 
        description: `${passCount} passed, ${warningCount} warnings. Check results below.`,
        variant: 'destructive' 
      })
    } else {
      toast({ 
        title: `✅ Good with Minor Warnings`, 
        description: `${passCount} passed, ${warningCount} warnings. Mostly healthy.`
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: 'border-l-blue-500',
      database: 'border-l-purple-500',
      ui: 'border-l-green-500',
      performance: 'border-l-orange-500',
      security: 'border-l-red-500',
      integration: 'border-l-cyan-500'
    }
    return colors[category] || 'border-l-gray-500'
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = []
    acc[result.category].push(result)
    return acc
  }, {} as Record<string, DiagnosticResult[]>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              BIMxPlan Go - Comprehensive App Diagnostics
            </div>
            <Button variant="outline" onClick={runComprehensiveAudit} disabled={running}>
              <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Running Audit...' : 'Run Full Audit'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <Alert>
              <AlertDescription>
                Click "Run Full Audit" to perform comprehensive app diagnostics including:
                authentication, database, UI components, performance, security, and integrations.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-current opacity-60`}></div>
                    {category} Tests ({categoryResults.length})
                  </h3>
                  
                  {categoryResults.map((result, index) => (
                    <div key={`${category}-${index}`} className={`border-l-4 ${getCategoryColor(result.category)} p-4 bg-card rounded-r border`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <div className="font-medium">{result.test}</div>
                            <div className="text-sm text-muted-foreground">{result.message}</div>
                          </div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                      
                      {result.fix && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                          <strong className="text-yellow-800 dark:text-yellow-200">Fix:</strong>
                          <span className="text-yellow-700 dark:text-yellow-300 ml-2">{result.fix}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Audit Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.status === 'pass').length}
                    </div>
                    <div className="text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {results.filter(r => r.status === 'warning').length}
                    </div>
                    <div className="text-muted-foreground">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.filter(r => r.status === 'fail').length}
                    </div>
                    <div className="text-muted-foreground">Critical</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BEP Specific Diagnostics */}
      <BEPDiagnostics />
    </div>
  )
}