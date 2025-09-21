import { NextRequest, NextResponse } from 'next/server';

// Mock NLP service for testing when the actual service is not running
const mockProcessingResult = {
  success: true,
  data: {
    originalText: '',
    language: { language: 'en', confidence: 0.9 },
    sentiment: { sentiment: 'neutral', confidence: 0.7 },
    keywords: ['app', 'mobile', 'user', 'feature'],
    summary: 'Mobile application with various features',
    classification: { category: 'mobile-app', confidence: 0.8 }
  },
  timestamp: new Date().toISOString()
};

const mockIntentResult = {
  success: true,
  data: {
    text: '',
    intent: 'create_app',
    confidence: 0.8,
    entities: [
      { type: 'feature', text: 'mobile app', confidence: 0.7 },
      { type: 'platform', text: 'iOS', confidence: 0.6 }
    ],
    action: 'initialize_app_creation',
    parameters: { appType: 'mobile', platform: 'cross-platform' }
  },
  timestamp: new Date().toISOString()
};

const mockEntityResult = {
  success: true,
  data: {
    domain: 'mobile-app',
    entities: [
      { id: 'entity_1', type: 'app_features', text: 'fitness tracking', confidence: 0.8, category: 'mobile-app' },
      { id: 'entity_2', type: 'platforms', text: 'iOS', confidence: 0.7, category: 'mobile-app' },
      { id: 'entity_3', type: 'user_roles', text: 'users', confidence: 0.9, category: 'mobile-app' }
    ],
    relationships: [],
    confidence: 0.8
  },
  timestamp: new Date().toISOString()
};

const mockRequirementResult = {
  success: true,
  data: {
    projectType: 'mobile-app',
    requirements: [
      {
        id: 'REQ_001',
        title: 'User Management',
        description: 'System should support user registration and authentication',
        priority: 'high',
        category: 'security'
      },
      {
        id: 'REQ_002',
        title: 'Data Management',
        description: 'System should provide data storage and retrieval capabilities',
        priority: 'medium',
        category: 'data'
      }
    ],
    features: [
      {
        id: 'FEAT_001',
        name: 'User Authentication',
        description: 'Login and registration functionality',
        complexity: 'medium',
        estimatedHours: 20
      },
      {
        id: 'FEAT_002',
        name: 'Data Storage',
        description: 'Local and cloud data synchronization',
        complexity: 'high',
        estimatedHours: 40
      }
    ],
    estimatedComplexity: 'medium',
    estimatedDuration: 'weeks',
    confidence: 0.7
  },
  timestamp: new Date().toISOString()
};

const mockSpecResult = {
  success: true,
  data: {
    format: 'json',
    generatedAt: new Date().toISOString(),
    requirements: {},
    specifications: {
      projectInfo: {
        name: 'Mobile App Project',
        description: 'Generated from requirements analysis',
        version: '1.0.0',
        type: 'mobile-application'
      },
      architecture: {
        type: 'layered',
        components: ['frontend', 'backend', 'database'],
        patterns: ['mvc', 'repository']
      },
      technicalSpecs: {
        platforms: ['iOS', 'Android'],
        languages: ['Swift', 'Kotlin', 'JavaScript'],
        frameworks: ['React Native', 'Node.js'],
        databases: ['PostgreSQL', 'Redis']
      }
    },
    metadata: {
      version: '1.0',
      generator: 'nlp-service',
      confidence: 0.8
    }
  },
  timestamp: new Date().toISOString()
};

// Mock pipeline result
const mockPipelineResult = {
  success: true,
  data: {
    originalInput: '',
    type: 'text',
    extractedText: '',
    entities: [
      { id: 'entity_1', type: 'app_features', text: 'fitness tracking', confidence: 0.8, category: 'mobile-app' },
      { id: 'entity_2', type: 'platforms', text: 'iOS', confidence: 0.7, category: 'mobile-app' }
    ],
    intent: {
      text: '',
      intent: 'create_app',
      confidence: 0.8,
      entities: [],
      action: 'initialize_app_creation',
      parameters: { appType: 'mobile' }
    },
    requirements: mockRequirementResult.data,
    specifications: mockSpecResult.data.specifications
  },
  timestamp: new Date().toISOString()
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, options = {} } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Try to connect to actual NLP service first
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await fetch(`${nlpServiceUrl}/api/nlp/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, options }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('NLP service not available, using mock data');
    }

    // Fallback to mock data
    const mockResult = JSON.parse(JSON.stringify(mockProcessingResult));
    mockResult.data.originalText = text;
    mockResult.data.keywords = extractKeywords(text);
    mockResult.data.summary = text.length > 100 ? text.substring(0, 100) + '...' : text;
    
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('Process text API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process text' },
      { status: 500 }
    );
  }
}

// Helper function to extract simple keywords
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}