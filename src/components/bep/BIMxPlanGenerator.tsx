import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, Loader2, Sparkles, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bimxPlanGoAPI } from '@/services/bimxplan-api';
import { ProjectData } from '@/lib/supabase';

interface BIMxPlanGeneratorProps {
  projectData: Partial<ProjectData>;
  onPlanGenerated?: (plan: string) => void;
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
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Generated BIM Execution Plan:</h4>
            <Textarea
              value={generatedPlan}
              readOnly
              className="min-h-[300px] font-mono text-sm"
              placeholder="Generated plan will appear here..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}