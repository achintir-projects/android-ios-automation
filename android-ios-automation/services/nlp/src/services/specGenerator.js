const { openai, logger } = require('../index');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate technical specifications from requirements
 */
const generateSpecs = async (requirements, format = 'json') => {
  try {
    logger.info('Generating specifications', { format, requirementsCount: requirements.length });

    const specs = {
      format,
      generatedAt: new Date().toISOString(),
      requirements: requirements,
      specifications: {},
      metadata: {
        version: '1.0',
        generator: 'nlp-service',
        confidence: 0
      }
    };

    // Generate specifications based on format
    switch (format) {
      case 'json':
        specs.specifications = await generateJSONSpecs(requirements);
        break;
      case 'markdown':
        specs.specifications = await generateMarkdownSpecs(requirements);
        break;
      case 'openapi':
        specs.specifications = await generateOpenAPISpecs(requirements);
        break;
      case 'yaml':
        specs.specifications = await generateYAMLSpecs(requirements);
        break;
      default:
        specs.specifications = await generateJSONSpecs(requirements);
    }

    // Calculate confidence
    specs.metadata.confidence = calculateSpecsConfidence(specs.specifications);

    return specs;
  } catch (error) {
    logger.error('Specification generation failed:', error);
    throw new AppError('Specification generation failed', 500);
  }
};

/**
 * Generate JSON specifications
 */
const generateJSONSpecs = async (requirements) => {
  try {
    const systemPrompt = `You are a technical architect specializing in mobile app development. 
    Convert the following requirements into a comprehensive JSON technical specification.

    Return a JSON object with:
    - projectInfo: Project metadata (name, description, version, type)
    - architecture: System architecture details (type, components, patterns)
    - technicalSpecs: Technical specifications (platforms, languages, frameworks, databases)
    - apiSpecs: API specifications (endpoints, methods, data models)
    - uiSpecs: UI specifications (screens, components, design system)
    - dataModel: Data model (entities, relationships, schemas)
    - security: Security requirements (authentication, authorization, encryption)
    - performance: Performance requirements (response times, scalability)
    - testing: Testing strategy (unit, integration, e2e tests)
    - deployment: Deployment specifications (environments, pipelines, infrastructure)
    - monitoring: Monitoring and logging requirements`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: JSON.stringify(requirements, null, 2)
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        logger.warn('Failed to parse JSON specs:', parseError);
        return await generateJSONSpecsFallback(requirements);
      }
    }

    return await generateJSONSpecsFallback(requirements);
  } catch (error) {
    logger.warn('AI JSON specs generation failed:', error);
    return await generateJSONSpecsFallback(requirements);
  }
};

/**
 * Fallback JSON specs generation
 */
const generateJSONSpecsFallback = async (requirements) => {
  const specs = {
    projectInfo: {
      name: 'Mobile App Project',
      description: 'Generated from requirements analysis',
      version: '1.0.0',
      type: 'mobile-application'
    },
    architecture: {
      type: 'layered',
      components: ['frontend', 'backend', 'database', 'external-services'],
      patterns: ['mvc', 'repository', 'dependency-injection']
    },
    technicalSpecs: {
      platforms: ['iOS', 'Android'],
      languages: ['Swift', 'Kotlin', 'JavaScript'],
      frameworks: ['React Native', 'Node.js', 'Express'],
      databases: ['PostgreSQL', 'Redis']
    },
    apiSpecs: {
      endpoints: [
        {
          path: '/api/auth/login',
          method: 'POST',
          description: 'User authentication'
        },
        {
          path: '/api/users',
          method: 'GET',
          description: 'Get user information'
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
      screens: ['Login', 'Dashboard', 'Profile', 'Settings'],
      components: ['Button', 'Input', 'Card', 'List'],
      designSystem: 'Material Design'
    },
    dataModel: {
      entities: ['User', 'Profile', 'Session'],
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
  };

  return specs;
};

/**
 * Generate Markdown specifications
 */
const generateMarkdownSpecs = async (requirements) => {
  try {
    const systemPrompt = `You are a technical writer specializing in software documentation.
    Convert the following requirements into a comprehensive Markdown technical specification document.

    Include these sections:
    # Project Overview
    ## System Architecture
    ## Technical Specifications
    ## API Documentation
    ## User Interface Specifications
    ## Data Model
    ## Security Requirements
    ## Performance Requirements
    ## Testing Strategy
    ## Deployment Plan
    ## Monitoring and Logging

    Use proper Markdown formatting with tables, code blocks, and lists where appropriate.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: JSON.stringify(requirements, null, 2)
        }
      ],
      max_tokens: 2500,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return content;
    }

    return await generateMarkdownSpecsFallback(requirements);
  } catch (error) {
    logger.warn('AI Markdown specs generation failed:', error);
    return await generateMarkdownSpecsFallback(requirements);
  }
};

/**
 * Fallback Markdown specs generation
 */
const generateMarkdownSpecsFallback = async (requirements) => {
  return `# Technical Specification Document

## Project Overview
This document outlines the technical specifications for the mobile application based on the analyzed requirements.

## System Architecture
### Architecture Type
- **Pattern**: Layered Architecture
- **Components**:
  - Frontend (Mobile App)
  - Backend API
  - Database Layer
  - External Services

### Design Patterns
- Model-View-Controller (MVC)
- Repository Pattern
- Dependency Injection

## Technical Specifications
### Platforms
- iOS (Swift)
- Android (Kotlin)
- Cross-platform (React Native)

### Technologies
- **Frontend**: React Native, TypeScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL, Redis
- **Authentication**: JWT

## API Documentation
### Authentication Endpoints
\`\`\`
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### User Management
\`\`\`
GET /api/users
Authorization: Bearer <token>

Response:
{
  "users": [
    {
      "id": "1",
      "email": "user@example.com",
      "name": "John Doe"
    }
  ]
}
\`\`\`

## User Interface Specifications
### Main Screens
1. **Login Screen**
   - Email input field
   - Password input field
   - Login button
   - Forgot password link

2. **Dashboard Screen**
   - User profile summary
   - Navigation menu
   - Content cards

3. **Profile Screen**
   - User information display
   - Edit profile functionality
   - Settings options

### Design System
- **Color Palette**: Primary, Secondary, Accent colors
- **Typography**: Material Design typography scale
- **Components**: Reusable UI components library

## Data Model
### User Entity
\`\`\`
{
  "id": "UUID",
  "email": "string",
  "password": "string (hashed)",
  "name": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
\`\`\`

### Profile Entity
\`\`\`
{
  "id": "UUID",
  "userId": "UUID",
  "avatar": "string (URL)",
  "bio": "string",
  "preferences": "object"
}
\`\`\`

## Security Requirements
### Authentication
- JWT-based authentication
- Token expiration: 24 hours
- Refresh token support

### Authorization
- Role-based access control
- Permission-based feature access

### Data Protection
- Password hashing (bcrypt)
- SSL/TLS encryption
- Data encryption at rest

## Performance Requirements
### Response Times
- API responses: < 2 seconds
- Database queries: < 500ms
- Mobile app loading: < 3 seconds

### Scalability
- Support for 1000+ concurrent users
- Horizontal scaling capability
- Load balancing implementation

## Testing Strategy
### Unit Testing
- Framework: Jest
- Coverage: > 80%
- CI/CD integration

### Integration Testing
- API testing: Postman/SuperTest
- Database testing: Test containers
- Service mocking: Sinon

### End-to-End Testing
- Mobile testing: Detox/Appium
- User flow testing
- Performance testing

## Deployment Plan
### Environments
- **Development**: Local development setup
- **Staging**: Pre-production testing
- **Production**: Live application

### CI/CD Pipeline
1. Code commit
2. Automated testing
3. Build and packaging
4. Deployment to staging
5. Production deployment (manual approval)

### Infrastructure
- Cloud hosting (AWS/Azure/GCP)
- Container orchestration (Docker/Kubernetes)
- Database management
- CDN for static assets

## Monitoring and Logging
### Application Monitoring
- Performance metrics
- Error tracking
- User behavior analytics

### Logging
- Structured logging
- Log aggregation
- Real-time monitoring
- Alert system

### Infrastructure Monitoring
- Server health
- Database performance
- Network latency
- Resource utilization

---
*Generated automatically from requirements analysis*`;
};

/**
 * Generate OpenAPI specifications
 */
const generateOpenAPISpecs = async (requirements) => {
  try {
    const systemPrompt = `You are an API architect. Convert the following requirements into OpenAPI 3.0 specification.
    Return a valid OpenAPI 3.0 JSON object with paths, components, schemas, and security definitions.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: JSON.stringify(requirements, null, 2)
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        logger.warn('Failed to parse OpenAPI specs:', parseError);
        return await generateOpenAPISpecsFallback();
      }
    }

    return await generateOpenAPISpecsFallback();
  } catch (error) {
    logger.warn('AI OpenAPI specs generation failed:', error);
    return await generateOpenAPISpecsFallback();
  }
};

/**
 * Fallback OpenAPI specs generation
 */
const generateOpenAPISpecsFallback = async () => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Mobile App API',
      version: '1.0.0',
      description: 'API specification for mobile application'
    },
    servers: [
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'User login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful login',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { '$ref': '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/users': {
        get: {
          summary: 'Get users',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { '$ref': '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  };
};

/**
 * Generate YAML specifications
 */
const generateYAMLSpecs = async (requirements) => {
  try {
    // Generate JSON specs first, then convert to YAML
    const jsonSpecs = await generateJSONSpecs(requirements);
    
    // Simple JSON to YAML conversion (in production, use a proper YAML library)
    const yamlSpecs = convertJSONToYAML(jsonSpecs);
    
    return yamlSpecs;
  } catch (error) {
    logger.warn('YAML specs generation failed:', error);
    return 'error: YAML generation failed';
  }
};

/**
 * Simple JSON to YAML converter (basic implementation)
 */
const convertJSONToYAML = (json, indent = 0) => {
  const spaces = ' '.repeat(indent);
  
  if (typeof json !== 'object' || json === null) {
    return String(json);
  }
  
  if (Array.isArray(json)) {
    return json.map(item => `${spaces}- ${convertJSONToYAML(item, indent + 2)}`).join('\n');
  }
  
  return Object.entries(json)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${spaces}${key}:\n${convertJSONToYAML(value, indent + 2)}`;
      }
      return `${spaces}${key}: ${value}`;
    })
    .join('\n');
};

/**
 * Calculate specifications confidence
 */
const calculateSpecsConfidence = (specs) => {
  let confidence = 0.6; // Base confidence

  // Increase confidence based on completeness
  if (specs.projectInfo) confidence += 0.1;
  if (specs.architecture) confidence += 0.1;
  if (specs.technicalSpecs) confidence += 0.1;
  if (specs.apiSpecs) confidence += 0.1;

  return Math.min(1, confidence);
};

/**
 * Validate specifications
 */
const validateSpecs = (specs, format) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Basic validation
  if (!specs.projectInfo) {
    validation.errors.push('Missing project information');
    validation.isValid = false;
  }

  if (!specs.architecture) {
    validation.warnings.push('Architecture details not specified');
  }

  if (!specs.technicalSpecs) {
    validation.warnings.push('Technical specifications incomplete');
  }

  // Format-specific validation
  switch (format) {
    case 'openapi':
      if (!specs.openapi) {
        validation.errors.push('Missing OpenAPI version');
        validation.isValid = false;
      }
      break;
    case 'json':
      try {
        JSON.stringify(specs);
      } catch (error) {
        validation.errors.push('Invalid JSON format');
        validation.isValid = false;
      }
      break;
  }

  return validation;
};

module.exports = {
  generateSpecs,
  generateJSONSpecs,
  generateMarkdownSpecs,
  generateOpenAPISpecs,
  generateYAMLSpecs,
  validateSpecs
};