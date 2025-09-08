import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Users, Database, FileText, Download } from "lucide-react"

interface TestResult {
  scenario: string
  role: 'Owner' | 'Collaborator'
  projectSize: 'Small' | 'Medium' | 'Large'
  results: {
    authentication: 'pass' | 'fail'
    projectAccess: 'pass' | 'fail'  
    previewUpdate: 'pass' | 'fail'
    pdfGeneration: 'pass' | 'fail'
    versionLogging: 'pass' | 'fail'
    mobileUsability: 'pass' | 'fail'
  }
  issues?: string[]
  screenshots?: string[]
}

interface BEPTestResultsProps {
  results: TestResult[]
}

export function BEPTestResults({ results }: BEPTestResultsProps) {
  const getStatusIcon = (status: 'pass' | 'fail') => {
    return status === 'pass' 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (status: 'pass' | 'fail') => {
    return <Badge variant={status === 'pass' ? 'default' : 'destructive'}>
      {status.toUpperCase()}
    </Badge>
  }

  const getTotalStatus = (results: TestResult['results']) => {
    const statuses = Object.values(results)
    const passCount = statuses.filter(s => s === 'pass').length
    const totalCount = statuses.length
    
    if (passCount === totalCount) return 'pass'
    return 'fail'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            BEP Preview & PDF Test Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{result.scenario}</span>
                      <Badge variant="outline">{result.role}</Badge>
                      <Badge variant="secondary">{result.projectSize}</Badge>
                    </div>
                    {getStatusBadge(getTotalStatus(result.results))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Authentication</span>
                      {getStatusIcon(result.results.authentication)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project Access</span>
                      {getStatusIcon(result.results.projectAccess)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Preview Update</span>
                      {getStatusIcon(result.results.previewUpdate)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">PDF Generation</span>
                      {getStatusIcon(result.results.pdfGeneration)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Version Logging</span>
                      {getStatusIcon(result.results.versionLogging)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mobile Usability</span>
                      {getStatusIcon(result.results.mobileUsability)}
                    </div>
                  </div>
                  
                  {result.issues && result.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Issues Found
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {result.issues.map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-600">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-3">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Tests:</span> {results.length}
              </div>
              <div>
                <span className="font-medium">Passed:</span> {results.filter(r => getTotalStatus(r.results) === 'pass').length}
              </div>
              <div>
                <span className="font-medium">Failed:</span> {results.filter(r => getTotalStatus(r.results) === 'fail').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}