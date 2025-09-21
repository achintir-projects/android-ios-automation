import { NextRequest, NextResponse } from 'next/server';

// Mock pipeline result for testing
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
    requirements: {
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
    }
  },
  timestamp: new Date().toISOString()
};

// Helper function to extract entities from text
function extractEntitiesFromText(text: string) {
  const lowerText = text.toLowerCase();
  const entities = [];
  
  const platforms = ['ios', 'android', 'web', 'cross-platform'];
  platforms.forEach(platform => {
    if (lowerText.includes(platform)) {
      entities.push({
        id: `platform_${platform}`,
        type: 'platforms',
        text: platform,
        confidence: 0.7,
        category: 'mobile-app'
      });
    }
  });
  
  const features = ['fitness', 'tracking', 'shopping', 'payment', 'social', 'messaging'];
  features.forEach(feature => {
    if (lowerText.includes(feature)) {
      entities.push({
        id: `feature_${feature}`,
        type: 'app_features',
        text: feature,
        confidence: 0.6,
        category: 'mobile-app'
      });
    }
  });
  
  return entities;
}

// Helper function to determine intent from text
function getIntentFromText(text: string) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('create') || lowerText.includes('build') || lowerText.includes('make') || lowerText.includes('develop')) {
    return {
      intent: 'create_app',
      confidence: 0.8,
      action: 'initialize_app_creation',
      parameters: { appType: 'mobile' }
    };
  }
  
  if (lowerText.includes('add') || lowerText.includes('include') || lowerText.includes('want')) {
    return {
      intent: 'add_feature',
      confidence: 0.7,
      action: 'add_feature_to_app',
      parameters: { featureType: 'general' }
    };
  }
  
  return {
    intent: 'request_info',
    confidence: 0.5,
    action: 'provide_information',
    parameters: {}
  };
}

// Helper function to generate requirements from text
function generateRequirementsFromText(text: string) {
  const lowerText = text.toLowerCase();
  const requirements = [];
  const features = [];
  
  if (lowerText.includes('user') || lowerText.includes('login') || lowerText.includes('auth')) {
    requirements.push({
      id: 'REQ_001',
      title: 'User Management',
      description: 'System should support user registration and authentication',
      priority: 'high',
      category: 'security'
    });
  }
  
  if (lowerText.includes('data') || lowerText.includes('storage') || lowerText.includes('database')) {
    requirements.push({
      id: 'REQ_002',
      title: 'Data Management',
      description: 'System should provide data storage and retrieval capabilities',
      priority: 'medium',
      category: 'data'
    });
  }
  
  const featureMap = [
    { keyword: 'fitness', name: 'Fitness Tracking', complexity: 'medium', hours: 25 },
    { keyword: 'payment', name: 'Payment Processing', complexity: 'high', hours: 45 },
    { keyword: 'social', name: 'Social Integration', complexity: 'medium', hours: 30 },
    { keyword: 'notification', name: 'Push Notifications', complexity: 'medium', hours: 20 },
    { keyword: 'camera', name: 'Camera Integration', complexity: 'high', hours: 35 }
  ];
  
  featureMap.forEach(({ keyword, name, complexity, hours }) => {
    if (lowerText.includes(keyword)) {
      features.push({
        id: `FEAT_${features.length + 1}`,
        name,
        description: `Include ${name.toLowerCase()} functionality`,
        complexity,
        estimatedHours: hours
      });
    }
  });
  
  const totalHours = features.reduce((sum, f) => sum + f.estimatedHours, 0);
  let complexity = 'low';
  if (totalHours > 80) complexity = 'high';
  else if (totalHours > 40) complexity = 'medium';
  
  return {
    projectType: 'mobile-app',
    requirements: requirements.length > 0 ? requirements : mockPipelineResult.data.requirements.requirements,
    features: features.length > 0 ? features : mockPipelineResult.data.requirements.features,
    estimatedComplexity: complexity,
    estimatedDuration: totalHours > 60 ? 'months' : 'weeks',
    confidence: Math.min(0.9, 0.5 + (requirements.length + features.length) * 0.1)
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, type = 'text', options = {} } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Input is required' },
        { status: 400 }
      );
    }

    // Try to connect to actual NLP service first
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await fetch(`${nlpServiceUrl}/api/nlp/complete-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, type, options }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('NLP service not available, using mock data');
    }

    // Fallback to mock data
    const mockResult = JSON.parse(JSON.stringify(mockPipelineResult));
    mockResult.data.originalInput = input;
    mockResult.data.type = type;
    mockResult.data.extractedText = type === 'text' ? input : 'Transcribed text from speech';
    mockResult.data.entities = extractEntitiesFromText(input);
    
    const intentData = getIntentFromText(input);
    mockResult.data.intent = {
      text: input,
      intent: intentData.intent,
      confidence: intentData.confidence,
      entities: [],
      action: intentData.action,
      parameters: { ...intentData.parameters, ...options }
    };
    
    mockResult.data.requirements = generateRequirementsFromText(input);
    
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('Complete pipeline API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to run complete pipeline' },
      { status: 500 }
    );
  }
}