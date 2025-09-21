import { NextRequest, NextResponse } from 'next/server';

// Mock intent result for testing
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

// Helper function to determine intent from text
function getIntentFromText(text: string): { intent: string; confidence: number; action: string; parameters: any } {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, context = {} } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Try to connect to actual NLP service first
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await fetch(`${nlpServiceUrl}/api/nlp/recognize-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, context }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('NLP service not available, using mock data');
    }

    // Fallback to mock data
    const intentData = getIntentFromText(text);
    const mockResult = JSON.parse(JSON.stringify(mockIntentResult));
    mockResult.data.text = text;
    mockResult.data.intent = intentData.intent;
    mockResult.data.confidence = intentData.confidence;
    mockResult.data.action = intentData.action;
    mockResult.data.parameters = { ...intentData.parameters, ...context };
    
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('Recognize intent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to recognize intent' },
      { status: 500 }
    );
  }
}