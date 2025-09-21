import { NextRequest, NextResponse } from 'next/server';

// Mock requirement result for testing
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

// Helper function to analyze requirements from text
function analyzeRequirementsFromText(description: string, projectType: string) {
  const lowerDesc = description.toLowerCase();
  const requirements = [];
  const features = [];
  
  // Basic requirement extraction
  if (lowerDesc.includes('user') || lowerDesc.includes('login') || lowerDesc.includes('auth')) {
    requirements.push({
      id: 'REQ_001',
      title: 'User Management',
      description: 'System should support user registration and authentication',
      priority: 'high',
      category: 'security'
    });
  }
  
  if (lowerDesc.includes('data') || lowerDesc.includes('storage') || lowerDesc.includes('database')) {
    requirements.push({
      id: 'REQ_002',
      title: 'Data Management',
      description: 'System should provide data storage and retrieval capabilities',
      priority: 'medium',
      category: 'data'
    });
  }
  
  // Feature extraction
  const featureMap = [
    { keyword: 'fitness', name: 'Fitness Tracking', complexity: 'medium', hours: 25 },
    { keyword: 'payment', name: 'Payment Processing', complexity: 'high', hours: 45 },
    { keyword: 'social', name: 'Social Integration', complexity: 'medium', hours: 30 },
    { keyword: 'notification', name: 'Push Notifications', complexity: 'medium', hours: 20 },
    { keyword: 'camera', name: 'Camera Integration', complexity: 'high', hours: 35 }
  ];
  
  featureMap.forEach(({ keyword, name, complexity, hours }) => {
    if (lowerDesc.includes(keyword)) {
      features.push({
        id: `FEAT_${features.length + 1}`,
        name,
        description: `Include ${name.toLowerCase()} functionality`,
        complexity,
        estimatedHours: hours
      });
    }
  });
  
  // Calculate complexity
  const totalHours = features.reduce((sum, f) => sum + f.estimatedHours, 0);
  let complexity = 'low';
  if (totalHours > 80) complexity = 'high';
  else if (totalHours > 40) complexity = 'medium';
  
  return {
    projectType,
    requirements: requirements.length > 0 ? requirements : mockRequirementResult.data.requirements,
    features: features.length > 0 ? features : mockRequirementResult.data.features,
    estimatedComplexity: complexity,
    estimatedDuration: totalHours > 60 ? 'months' : 'weeks',
    confidence: Math.min(0.9, 0.5 + (requirements.length + features.length) * 0.1)
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, projectType = 'mobile-app' } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    // Try to connect to actual NLP service first
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await fetch(`${nlpServiceUrl}/api/nlp/analyze-requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, projectType }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('NLP service not available, using mock data');
    }

    // Fallback to mock data
    const analyzedData = analyzeRequirementsFromText(description, projectType);
    const mockResult = JSON.parse(JSON.stringify(mockRequirementResult));
    mockResult.data = analyzedData;
    
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('Analyze requirements API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to analyze requirements' },
      { status: 500 }
    );
  }
}