import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileText, Loader2, Sparkles, Download, Eye, Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bimxPlanGoAPI } from '@/services/bimxplan-api';
import { ProjectData } from '@/lib/supabase';

interface BIMxPlanGeneratorProps {
  projectData: Partial<ProjectData>;
  onPlanGenerated?: (plan: string) => void;
}

// Simple Markdown Renderer Component
const MarkdownRenderer = ({ content }: { content: string }) => {
  // Convert markdown to HTML for basic rendering
  const formatMarkdown = (text: string) => {
    return text
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-6">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$1. $2</li>')
      
      // Code blocks
      .replace(/```(.+?)```/gs, '<pre class="bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm">$1</code></pre>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br />')
  }

  const formattedContent = formatMarkdown(content)
  
  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ 
        __html: `<p class="mb-4">${formattedContent}</p>` 
      }} 
    />
  )
}

export function BIMxPlanGenerator({ projectData, onPlanGenerated }: BIMxPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const formatProjectDetails = (data: Partial<ProjectData>): string => {
    const details = [];
    
    if (data.project_overview) {
      details.push(`Project Name: ${data.project_overview.project_name || 'Not specified'}`);
      details.push(`Location: ${data.project_overview.location || 'Not specified'}`);
      details.push(`Client: ${data.project_overview.client_name || 'Not specified'}`);
      details.push(`Project Type: ${data.project_overview.project_type || 'Not specified'}`);
      
      if (data.project_overview.key_milestones?.length) {
        details.push(`Key Milestones: ${data.project_overview.key_milestones.map(m => m.name).join(', ')}`);
      }
    }

    if (data.team_responsibilities?.firms?.length) {
      details.push(`Team Firms: ${data.team_responsibilities.firms.map(f => f.name).join(', ')}`);
    }

    if (data.software_overview?.main_tools?.length) {
      details.push(`Primary Software: ${data.software_overview.main_tools.map(t => t.name).join(', ')}`);
    }

    if (data.modeling_scope) {
      details.push(`Modeling Units: ${data.modeling_scope.units || 'Not specified'}`);
      details.push(`General LOD: ${data.modeling_scope.general_lod || 'Not specified'}`);
    }

    if (data.collaboration_cde) {
      details.push(`CDE Platform: ${data.collaboration_cde.platform || 'Not specified'}`);
    }

    return details.join('\n');
  };

  const handleGeneratePlan = async () => {
    if (!projectData) {
      toast({
        title: "No project data",
        description: "Please fill in the project information first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const projectDetails = formatProjectDetails(projectData);
      const response = await bimxPlanGoAPI.generateCompleteBIMPlan(projectDetails);
      
      if (response.success) {
        setGeneratedPlan(response.response);
        onPlanGenerated?.(response.response);
        toast({
          title: "BIM Plan Generated",
          description: "Complete BIM execution plan has been generated successfully."
        });
      } else {
        throw new Error(response.error || 'Failed to generate plan');
      }
    } catch (error) {
      console.error('Error generating BIM plan:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate BIM plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!generatedPlan) {
      toast({
        title: "No plan to export",
        description: "Please generate a plan first.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const response = await bimxPlanGoAPI.exportPlanToMarkdown(generatedPlan);
      
      if (response.success) {
        // Create download link
        const blob = new Blob([response.response], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bim-execution-plan-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Successful",
          description: "BIM plan exported as Markdown file."
        });
      } else {
        throw new Error(response.error || 'Failed to export plan');
      }
    } catch (error) {
      console.error('Error exporting plan:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hasProjectData = projectData && Object.keys(projectData).length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered BIM Plan Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate a complete BIM execution plan using advanced AI based on your project data.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={hasProjectData ? "default" : "secondary"}>
            {hasProjectData ? "Project Data Available" : "No Project Data"}
          </Badge>
          {!hasProjectData && (
            <div className="flex items-center gap-1 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Fill project forms to enable generation
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGeneratePlan}
            disabled={!hasProjectData || isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Complete BIM Plan'}
          </Button>

          {generatedPlan && (
            <Button
              variant="outline"
              onClick={handleExportMarkdown}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Markdown
            </Button>
          )}
        </div>

        {generatedPlan && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-4">Generated BIM Execution Plan:</h4>
            <Tabs defaultValue="formatted" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="formatted" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Formatted View
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Markdown Source
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="formatted" className="mt-4">
                <div className="border rounded-lg p-6 bg-white min-h-[400px] max-h-[600px] overflow-y-auto">
                  <MarkdownRenderer content={generatedPlan} />
                </div>
              </TabsContent>
              
              <TabsContent value="markdown" className="mt-4">
                <Textarea
                  value={generatedPlan}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Generated plan will appear here..."
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}