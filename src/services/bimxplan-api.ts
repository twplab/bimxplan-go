export interface BIMxPlanGoResponse {
  success: boolean;
  response: string;
  error?: string;
  agent_name: string;
  task_name: string;
}

export interface BIMxPlanGoVariables {
  project_details?: string;
  plan_content?: string;
  modification_details?: string;
  original_plan?: string;
  section_name?: string;
  updated_data?: string;
}

export interface BIMxPlanGoRequest {
  agent_uuid: string;
  variables: BIMxPlanGoVariables;
}

const BIMXPLAN_API_BASE = 'https://agent.kith.build/prompt';
const AGENT_UUID = '130719f4-4e83-4d85-941a-c45842483e38';
const API_KEY = 'sk-3b_8o8TQqdkE9j6PIpOhTKBTGm152H91E7EI2juDqHU';

class BIMxPlanGoAPI {
  private async makeRequest(endpoint: string, variables: BIMxPlanGoVariables): Promise<BIMxPlanGoResponse> {
    const request: BIMxPlanGoRequest = {
      agent_uuid: AGENT_UUID,
      variables
    };

    const response = await fetch(`${BIMXPLAN_API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async generateCompleteBIMPlan(projectDetails: string): Promise<BIMxPlanGoResponse> {
    return this.makeRequest('d3cd1de8-e34e-4144-a5a6-229399271a18', {
      project_details: projectDetails
    });
  }

  async exportPlanToMarkdown(planContent: string): Promise<BIMxPlanGoResponse> {
    return this.makeRequest('2fce73d5-d5b5-4036-a610-afae379d0cbd', {
      plan_content: planContent
    });
  }

  async regeneratePlanSection(
    sectionName: string,
    originalPlan: string,
    updatedData: string,
    modificationDetails: string
  ): Promise<BIMxPlanGoResponse> {
    return this.makeRequest('56514e54-54b0-40a7-8419-4458134551b9', {
      section_name: sectionName,
      original_plan: originalPlan,
      updated_data: updatedData,
      modification_details: modificationDetails
    });
  }
}

export const bimxPlanGoAPI = new BIMxPlanGoAPI();