import ZAI from 'z-ai-web-dev-sdk';
import { ragPromptingSystem } from './rag-prompting';
import { initializeKnowledgeBase } from './knowledge-base';
import { cleanAndValidateJSON } from '../app/api/nlp/analyze-requirements/route';

export interface RAGAnalysisResult {
  success: boolean;
  data?: {
    project_name: string;
    core_domain: string;
    features: Array<{
      name: string;
      description: string;
      user_story: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      functional_requirements: string[];
      non_functional_requirements: string[];
    }>;
  };
  error?: string;
  metadata?: {
    processingTime: number;
    contextRetrieved: boolean;
    fallbackUsed: boolean;
    confidence: number;
  };
}

export class RAGOrchestration {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  // Initialize the RAG system
  private async initialize() {
    try {
      await initializeKnowledgeBase();
      this.initialized = true;
      console.log('RAG system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG system:', error);
      // Don't throw here - we'll use fallback mode
    }
  }

  // Main analysis method
  async analyzeRequirements(userInput: string, detectedDomain: string): Promise<RAGAnalysisResult> {
    const startTime = Date.now();
    let contextRetrieved = false;
    let fallbackUsed = false;
    let confidence = 0.5;

    try {
      // Generate prompt using RAG system
      let prompt: string;
      
      if (this.initialized) {
        try {
          prompt = await ragPromptingSystem.generatePrompt(userInput, detectedDomain);
          contextRetrieved = true;
          confidence = 0.8;
        } catch (contextError) {
          console.warn('Failed to retrieve context, using fallback:', contextError);
          prompt = ragPromptingSystem.generateFallbackPrompt(userInput, detectedDomain);
          fallbackUsed = true;
          confidence = 0.6;
        }
      } else {
        prompt = ragPromptingSystem.generateFallbackPrompt(userInput, detectedDomain);
        fallbackUsed = true;
        confidence = 0.6;
      }

      // Call LLM with timeout
      const response = await this.callLLMWithTimeout(prompt);
      
      if (!response) {
        throw new Error('No response from LLM');
      }

      // Parse and validate the response
      const result = await this.parseAndValidateResponse(response);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        metadata: {
          processingTime,
          contextRetrieved,
          fallbackUsed,
          confidence
        }
      };

    } catch (error) {
      console.error('RAG analysis failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime,
          contextRetrieved,
          fallbackUsed,
          confidence: 0.1
        }
      };
    }
  }

  // Call LLM with timeout and error handling
  private async callLLMWithTimeout(prompt: string): Promise<string> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('LLM timeout')), 30000);
    });

    try {
      const zai = await ZAI.create();
      
      const llmPromise = zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert product manager and software architect. Generate precise, structured JSON output based on the provided instructions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const response = await Promise.race([llmPromise, timeoutPromise]) as any;
      
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('LLM call failed:', error);
      throw error;
    }
  }

  // Parse and validate LLM response
  private async parseAndValidateResponse(response: string): Promise<any> {
    try {
      // Clean and validate JSON
      const cleanContent = cleanAndValidateJSON(response);
      const parsed = JSON.parse(cleanContent);

      // Validate required fields
      if (!parsed.project_name || !parsed.core_domain || !parsed.features) {
        throw new Error('Missing required fields in LLM response');
      }

      if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
        throw new Error('Features array is missing or empty');
      }

      // Validate each feature
      parsed.features = parsed.features.map((feature: any, index: number) => ({
        name: feature.name || `Feature ${index + 1}`,
        description: feature.description || 'No description provided',
        user_story: feature.user_story || this.generateUserStory(feature.name, parsed.core_domain),
        priority: this.validatePriority(feature.priority),
        functional_requirements: this.validateRequirements(feature.functional_requirements, 'functional'),
        non_functional_requirements: this.validateRequirements(feature.non_functional_requirements, 'non-functional')
      }));

      return parsed;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Raw response:', response);
      throw error;
    }
  }

  // Validate and normalize priority
  private validatePriority(priority: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const normalized = priority?.toUpperCase();
    if (normalized === 'HIGH' || normalized === 'MEDIUM' || normalized === 'LOW') {
      return normalized;
    }
    return 'MEDIUM'; // Default priority
  }

  // Validate and normalize requirements array
  private validateRequirements(requirements: any[], type: string): string[] {
    if (!Array.isArray(requirements)) {
      return [`${type} requirements not specified`];
    }
    
    return requirements
      .filter(req => typeof req === 'string' && req.trim().length > 0)
      .map(req => req.trim())
      .slice(0, 5); // Limit to 5 requirements per type
  }

  // Generate a fallback user story
  private generateUserStory(featureName: string, domain: string): string {
    const userTypes: Record<string, string> = {
      banking: 'bank customer',
      ecommerce: 'shopper',
      healthcare: 'patient',
      kyc: 'compliance officer'
    };

    const userType = userTypes[domain.toLowerCase()] || 'user';
    
    return `As a ${userType}, I want to use ${featureName.toLowerCase()} so that I can accomplish my tasks efficiently.`;
  }

  // Get system status
  getStatus() {
    return {
      initialized: this.initialized,
      available: true
    };
  }
}

// Singleton instance
export const ragOrchestration = new RAGOrchestration();