import { NextRequest, NextResponse } from 'next/server';

// Mock spec result for testing
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
      },
      apiSpecs: {
        endpoints: [
          {
            path: '/api/auth/login',
            method: 'POST',
            description: 'User authentication'
          }
        ],
        dataModels: {
          User: {
            id: 'string',
            email: 'string',
            name: 'string',
            createdAt: 'datetime'
          }
        }
      },
      uiSpecs: {
        screens: ['Login', 'Dashboard', 'Profile'],
        components: ['Button', 'Input', 'Card'],
        designSystem: 'Material Design'
      },
      dataModel: {
        entities: ['User', 'Profile'],
        relationships: [
          {
            from: 'User',
            to: 'Profile',
            type: 'one-to-one'
          }
        ]
      },
      security: {
        authentication: 'JWT',
        authorization: 'Role-based',
        encryption: 'AES-256'
      },
      performance: {
        responseTime: '< 2s',
        scalability: '1000+ concurrent users',
        availability: '99.9%'
      },
      testing: {
        unit: 'Jest',
        integration: 'Detox',
        e2e: 'Appium'
      },
      deployment: {
        environments: ['development', 'staging', 'production'],
        pipeline: 'CI/CD',
        infrastructure: 'Cloud-based'
      },
      monitoring: {
        logging: 'Winston',
        metrics: 'Prometheus',
        alerts: 'Grafana'
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

// Helper function to generate specs from requirements
function generateSpecsFromRequirements(requirements: any, format: string) {
  const baseSpecs = mockSpecResult.data.specifications;
  
  // Customize specs based on requirements
  if (requirements.features) {
    const totalHours = requirements.features.reduce((sum: number, f: any) => sum + (f.estimatedHours || 0), 0);
    
    if (totalHours > 80) {
      baseSpecs.architecture.components.push('load-balancer', 'cache-layer');
      baseSpecs.performance.scalability = '5000+ concurrent users';
    }
    
    // Add specific features to technical specs
    requirements.features.forEach((feature: any) => {
      if (feature.name.toLowerCase().includes('payment')) {
        baseSpecs.technicalSpecs.frameworks.push('Stripe SDK');
        baseSpecs.security.encryption = 'AES-256 + PCI DSS';
      }
      if (feature.name.toLowerCase().includes('social')) {
        baseSpecs.technicalSpecs.frameworks.push('Social Media APIs');
      }
    });
  }
  
  return baseSpecs;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requirements, format = 'json' } = body;

    if (!requirements || typeof requirements !== 'object') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Requirements are required and must be an object' },
        { status: 400 }
      );
    }

    // Try to connect to actual NLP service first
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await fetch(`${nlpServiceUrl}/api/nlp/generate-specs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requirements, format }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('NLP service not available, using mock data');
    }

    // Fallback to mock data
    const generatedSpecs = generateSpecsFromRequirements(requirements, format);
    const mockResult = JSON.parse(JSON.stringify(mockSpecResult));
    mockResult.data.specifications = generatedSpecs;
    mockResult.data.format = format;
    mockResult.data.requirements = requirements;
    
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('Generate specs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to generate specifications' },
      { status: 500 }
    );
  }
}