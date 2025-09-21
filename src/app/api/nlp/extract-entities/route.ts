import { NextRequest, NextResponse } from 'next/server';

// Mock entity result for testing
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

// Helper function to extract entities from text
function extractEntitiesFromText(text: string, domain: string) {
  const lowerText = text.toLowerCase();
  const entities = [];
  
  // Platform detection
  const platforms = ['ios', 'android', 'web', 'cross-platform'];
  platforms.forEach(platform => {
    if (lowerText.includes(platform)) {
      entities.push({
        id: `platform_${platform}`,
        type: 'platforms',
        text: platform,
        confidence: 0.7,
        category: domain
      });
    }
  });
  
  // Feature detection
  const features = ['fitness', 'tracking', 'shopping', 'payment', 'social', 'messaging'];
  features.forEach(feature => {
    if (lowerText.includes(feature)) {
      entities.push({
        id: `feature_${feature}`,
        type: 'app_features',
        text: feature,
        confidence: 0.6,
        category: domain
      });
    }
  });
  
  // User role detection
  if (lowerText.includes('user') || lowerText.includes('customer')) {
    entities.push({
      id: 'user_role',
      type: 'user_roles',
      text: 'users',
      confidence: 0.8,
      category: domain
    });
  }
  
  return entities;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, domain = 'mobile-app' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Try to connect to actual NLP service first
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await fetch(`${nlpServiceUrl}/api/nlp/extract-entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, domain }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('NLP service not available, using mock data');
    }

    // Fallback to mock data
    const mockResult = JSON.parse(JSON.stringify(mockEntityResult));
    mockResult.data.domain = domain;
    mockResult.data.entities = extractEntitiesFromText(text, domain);
    mockResult.data.confidence = mockResult.data.entities.length > 0 ? 0.7 : 0.3;
    
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('Extract entities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to extract entities' },
      { status: 500 }
    );
  }
}