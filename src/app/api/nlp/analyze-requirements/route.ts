import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Domain-specific feature templates
const domainTemplates = {
  kyc: {
    name: "KYC (Know Your Customer) Validation System",
    features: [
      {
        id: 'KYC_001',
        name: 'Customer Identity Verification',
        description: 'Multi-factor identity verification including document validation, biometric verification, and identity proofing',
        complexity: 'high',
        estimatedHours: 60,
        category: 'core_verification'
      },
      {
        id: 'KYC_002',
        name: 'Customer Due Diligence (CDD)',
        description: 'Risk-based customer assessment including enhanced due diligence for high-risk customers',
        complexity: 'high',
        estimatedHours: 45,
        category: 'compliance'
      },
      {
        id: 'KYC_003',
        name: 'Anti-Money Laundering (AML) Screening',
        description: 'Real-time screening against global watchlists, PEPs, and sanctions lists',
        complexity: 'high',
        estimatedHours: 70,
        category: 'compliance'
      },
      {
        id: 'KYC_004',
        name: 'Ongoing Monitoring',
        description: 'Continuous transaction monitoring and suspicious activity detection',
        complexity: 'high',
        estimatedHours: 55,
        category: 'monitoring'
      },
      {
        id: 'KYC_005',
        name: 'Document Management',
        description: 'Secure document capture, storage, and verification with OCR capabilities',
        complexity: 'medium',
        estimatedHours: 35,
        category: 'document_management'
      },
      {
        id: 'KYC_006',
        name: 'Compliance Reporting',
        description: 'Automated generation of regulatory reports and audit trails',
        complexity: 'medium',
        estimatedHours: 40,
        category: 'reporting'
      },
      {
        id: 'KYC_007',
        name: 'Risk Assessment Engine',
        description: 'AI-powered risk scoring and customer risk categorization',
        complexity: 'high',
        estimatedHours: 50,
        category: 'risk_management'
      },
      {
        id: 'KYC_008',
        name: 'Audit Trail Management',
        description: 'Comprehensive logging and audit trail for all compliance activities',
        complexity: 'medium',
        estimatedHours: 30,
        category: 'compliance'
      }
    ],
    requirements: [
      {
        id: 'REQ_KYC_001',
        title: 'Regulatory Compliance',
        description: 'System must comply with KYC, AML, and GDPR regulations',
        priority: 'critical',
        category: 'compliance'
      },
      {
        id: 'REQ_KYC_002',
        title: 'Data Security',
        description: 'End-to-end encryption and secure storage of sensitive customer data',
        priority: 'critical',
        category: 'security'
      },
      {
        id: 'REQ_KYC_003',
        title: 'Integration Capabilities',
        description: 'API integration with third-party verification services and databases',
        priority: 'high',
        category: 'integration'
      }
    ],
    promptTemplate: `You are an expert business analyst and software architect specializing in KYC (Know Your Customer) and compliance systems.

Analyze the following project description and extract structured requirements for a KYC validation system. Focus on regulatory compliance, security, and identity verification.

Key features for KYC systems include:
- Customer Identity Verification (document validation, biometric verification)
- Customer Due Diligence (CDD) and Enhanced Due Diligence (EDD)
- Anti-Money Laundering (AML) screening and monitoring
- Ongoing transaction monitoring and suspicious activity detection
- Document management with OCR capabilities
- Compliance reporting and audit trails
- Risk assessment and customer categorization
- Integration with third-party verification services

Regulatory considerations:
- KYC/AML regulations (FATF, FinCEN, etc.)
- GDPR and data privacy requirements
- Sanctions compliance (OFAC, UN, EU)
- PEP (Politically Exposed Persons) screening
- Adverse media monitoring

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, headers, or explanatory text. The response must be parsable JSON.

The JSON structure must be exactly as follows:
{
  "requirements": [
    {
      "id": "REQ_001",
      "title": "Requirement Title",
      "description": "Detailed description of the requirement",
      "priority": "critical|high|medium|low",
      "category": "category_name"
    }
  ],
  "features": [
    {
      "id": "FEAT_001",
      "name": "Feature Name",
      "description": "Detailed description of the feature",
      "complexity": "low|medium|high",
      "estimatedHours": 40,
      "category": "category_name"
    }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "assumptions": ["assumption 1", "assumption 2"],
  "risks": [
    {
      "description": "Risk description",
      "impact": "low|medium|high",
      "probability": "low|medium|high"
    }
  ],
  "priorities": [
    {
      "item": "priority item",
      "priority_level": "critical|high|medium|low",
      "justification": "reason for priority"
    }
  ],
  "dependencies": [
    {
      "from": "source item",
      "to": "target item",
      "type": "dependency_type"
    }
  ],
  "complexity": "low|medium|high",
  "duration": "days|weeks|months",
  "confidence": 0.8,
  "detectedDomain": "domain_name"
}

Return a comprehensive analysis with domain-specific features and compliance requirements in valid JSON format only.`
  },
  banking: {
    name: "Banking Application",
    features: [
      {
        id: 'BANK_001',
        name: 'Account Management',
        description: 'Customer account creation, management, and closure with multi-factor authentication',
        complexity: 'medium',
        estimatedHours: 40,
        category: 'core_banking'
      },
      {
        id: 'BANK_002',
        name: 'Transaction Processing',
        description: 'Secure transaction processing, settlement, and reconciliation',
        complexity: 'high',
        estimatedHours: 60,
        category: 'core_banking'
      },
      {
        id: 'BANK_003',
        name: 'Payment Gateway Integration',
        description: 'Integration with various payment networks and processors',
        complexity: 'high',
        estimatedHours: 50,
        category: 'payments'
      },
      {
        id: 'BANK_004',
        name: 'Fraud Detection System',
        description: 'Real-time fraud detection and prevention mechanisms',
        complexity: 'high',
        estimatedHours: 55,
        category: 'security'
      },
      {
        id: 'BANK_005',
        name: 'Loan Management',
        description: 'Loan application, approval, and management system',
        complexity: 'high',
        estimatedHours: 65,
        category: 'lending'
      }
    ],
    requirements: [
      {
        id: 'REQ_BANK_001',
        title: 'Banking Compliance',
        description: 'Must comply with banking regulations and standards',
        priority: 'critical',
        category: 'compliance'
      },
      {
        id: 'REQ_BANK_002',
        title: 'Security Standards',
        description: 'Implement banking-grade security and encryption',
        priority: 'critical',
        category: 'security'
      }
    ],
    promptTemplate: `You are an expert business analyst and software architect specializing in banking applications.

Analyze the following project description for a banking application. Focus on security, compliance, and core banking functionality.

Key features for banking systems include:
- Account management and authentication
- Secure transaction processing
- Payment gateway integration
- Fraud detection and prevention
- Loan management and processing
- Interest calculation and management
- Regulatory reporting
- Mobile and online banking

Regulatory considerations:
- Banking regulations (Basel III, Dodd-Frank, etc.)
- PCI DSS compliance
- AML requirements
- Data protection laws
- Reserve requirements

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, headers, or explanatory text. The response must be parsable JSON.

The JSON structure must be exactly as follows:
{
  "requirements": [
    {
      "id": "REQ_001",
      "title": "Requirement Title",
      "description": "Detailed description of the requirement",
      "priority": "critical|high|medium|low",
      "category": "category_name"
    }
  ],
  "features": [
    {
      "id": "FEAT_001",
      "name": "Feature Name",
      "description": "Detailed description of the feature",
      "complexity": "low|medium|high",
      "estimatedHours": 40,
      "category": "category_name"
    }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "assumptions": ["assumption 1", "assumption 2"],
  "risks": [
    {
      "description": "Risk description",
      "impact": "low|medium|high",
      "probability": "low|medium|high"
    }
  ],
  "priorities": [
    {
      "item": "priority item",
      "priority_level": "critical|high|medium|low",
      "justification": "reason for priority"
    }
  ],
  "dependencies": [
    {
      "from": "source item",
      "to": "target item",
      "type": "dependency_type"
    }
  ],
  "complexity": "low|medium|high",
  "duration": "days|weeks|months",
  "confidence": 0.8,
  "detectedDomain": "domain_name"
}

Return a comprehensive analysis with banking-specific features and compliance requirements in valid JSON format only.`
  },
  finance: {
    name: "Financial Application",
    features: [
      {
        id: 'FIN_001',
        name: 'Portfolio Management',
        description: 'Investment portfolio tracking, analysis, and management',
        complexity: 'medium',
        estimatedHours: 35,
        category: 'investment'
      },
      {
        id: 'FIN_002',
        name: 'Financial Analytics',
        description: 'Advanced financial reporting, analytics, and insights',
        complexity: 'high',
        estimatedHours: 45,
        category: 'analytics'
      },
      {
        id: 'FIN_003',
        name: 'Trading Platform',
        description: 'Securities trading and order management system',
        complexity: 'high',
        estimatedHours: 70,
        category: 'trading'
      },
      {
        id: 'FIN_004',
        name: 'Risk Management',
        description: 'Financial risk assessment and management tools',
        complexity: 'high',
        estimatedHours: 50,
        category: 'risk_management'
      }
    ],
    requirements: [
      {
        id: 'REQ_FIN_001',
        title: 'Financial Compliance',
        description: 'Comply with financial regulations and standards',
        priority: 'critical',
        category: 'compliance'
      },
      {
        id: 'REQ_FIN_002',
        title: 'Data Accuracy',
        description: 'Ensure high accuracy of financial data and calculations',
        priority: 'high',
        category: 'data_quality'
      }
    ],
    promptTemplate: `You are an expert business analyst and software architect specializing in financial applications.

Analyze the following project description for a financial application. Focus on data accuracy, analytics, and financial functionality.

Key features for financial systems include:
- Portfolio management and tracking
- Financial analytics and reporting
- Trading and investment platforms
- Risk management and assessment
- Market data integration
- Algorithmic trading capabilities
- Financial planning tools
- Regulatory compliance

Regulatory considerations:
- SEC regulations
- FINRA rules
- MiFID II compliance
- Market data regulations
- Investor protection laws

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, headers, or explanatory text. The response must be parsable JSON.

The JSON structure must be exactly as follows:
{
  "requirements": [
    {
      "id": "REQ_001",
      "title": "Requirement Title",
      "description": "Detailed description of the requirement",
      "priority": "critical|high|medium|low",
      "category": "category_name"
    }
  ],
  "features": [
    {
      "id": "FEAT_001",
      "name": "Feature Name",
      "description": "Detailed description of the feature",
      "complexity": "low|medium|high",
      "estimatedHours": 40,
      "category": "category_name"
    }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "assumptions": ["assumption 1", "assumption 2"],
  "risks": [
    {
      "description": "Risk description",
      "impact": "low|medium|high",
      "probability": "low|medium|high"
    }
  ],
  "priorities": [
    {
      "item": "priority item",
      "priority_level": "critical|high|medium|low",
      "justification": "reason for priority"
    }
  ],
  "dependencies": [
    {
      "from": "source item",
      "to": "target item",
      "type": "dependency_type"
    }
  ],
  "complexity": "low|medium|high",
  "duration": "days|weeks|months",
  "confidence": 0.8,
  "detectedDomain": "domain_name"
}

Return a comprehensive analysis with finance-specific features and compliance requirements in valid JSON format only.`
  },
  healthcare: {
    name: "Healthcare Application",
    features: [
      {
        id: 'HEALTH_001',
        name: 'Patient Management',
        description: 'Patient records, appointments, and care management',
        complexity: 'high',
        estimatedHours: 50,
        category: 'patient_care'
      },
      {
        id: 'HEALTH_002',
        name: 'HIPAA Compliance',
        description: 'HIPAA compliance and patient data protection',
        complexity: 'high',
        estimatedHours: 45,
        category: 'compliance'
      },
      {
        id: 'HEALTH_003',
        name: 'Medical Records',
        description: 'Electronic health records (EHR) management',
        complexity: 'high',
        estimatedHours: 60,
        category: 'records'
      }
    ],
    requirements: [
      {
        id: 'REQ_HEALTH_001',
        title: 'HIPAA Compliance',
        description: 'Must comply with HIPAA regulations',
        priority: 'critical',
        category: 'compliance'
      }
    ],
    promptTemplate: `You are an expert business analyst and software architect specializing in healthcare applications.

Analyze the following project description for a healthcare application. Focus on patient care, data privacy, and regulatory compliance.

Key features for healthcare systems include:
- Patient management and scheduling
- Electronic health records (EHR)
- HIPAA compliance and data security
- Telemedicine capabilities
- Medical billing and insurance integration
- Prescription management
- Clinical decision support
- Healthcare analytics

Regulatory considerations:
- HIPAA regulations
- HITECH Act
- FDA regulations for medical devices
- State healthcare laws
- Patient protection laws

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, headers, or explanatory text. The response must be parsable JSON.

The JSON structure must be exactly as follows:
{
  "requirements": [
    {
      "id": "REQ_001",
      "title": "Requirement Title",
      "description": "Detailed description of the requirement",
      "priority": "critical|high|medium|low",
      "category": "category_name"
    }
  ],
  "features": [
    {
      "id": "FEAT_001",
      "name": "Feature Name",
      "description": "Detailed description of the feature",
      "complexity": "low|medium|high",
      "estimatedHours": 40,
      "category": "category_name"
    }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "assumptions": ["assumption 1", "assumption 2"],
  "risks": [
    {
      "description": "Risk description",
      "impact": "low|medium|high",
      "probability": "low|medium|high"
    }
  ],
  "priorities": [
    {
      "item": "priority item",
      "priority_level": "critical|high|medium|low",
      "justification": "reason for priority"
    }
  ],
  "dependencies": [
    {
      "from": "source item",
      "to": "target item",
      "type": "dependency_type"
    }
  ],
  "complexity": "low|medium|high",
  "duration": "days|weeks|months",
  "confidence": 0.8,
  "detectedDomain": "domain_name"
}

Return a comprehensive analysis with healthcare-specific features and compliance requirements in valid JSON format only.`
  },
  ecommerce: {
    name: "E-commerce Platform",
    features: [
      {
        id: 'ECOM_001',
        name: 'Product Catalog',
        description: 'Product management, categorization, and search',
        complexity: 'medium',
        estimatedHours: 30,
        category: 'catalog'
      },
      {
        id: 'ECOM_002',
        name: 'Shopping Cart',
        description: 'Shopping cart functionality and checkout process',
        complexity: 'medium',
        estimatedHours: 25,
        category: 'checkout'
      },
      {
        id: 'ECOM_003',
        name: 'Payment Processing',
        description: 'Secure payment processing and multiple payment methods',
        complexity: 'high',
        estimatedHours: 40,
        category: 'payments'
      },
      {
        id: 'ECOM_004',
        name: 'Order Management',
        description: 'Order processing, tracking, and fulfillment',
        complexity: 'medium',
        estimatedHours: 35,
        category: 'orders'
      }
    ],
    requirements: [
      {
        id: 'REQ_ECOM_001',
        title: 'Payment Security',
        description: 'PCI DSS compliance and secure payment processing',
        priority: 'high',
        category: 'security'
      }
    ],
    promptTemplate: `You are an expert business analyst and software architect specializing in e-commerce platforms.

Analyze the following project description for an e-commerce application. Focus on user experience, payment processing, and scalability.

Key features for e-commerce systems include:
- Product catalog management
- Shopping cart and checkout
- Payment processing
- Order management and fulfillment
- Inventory management
- Customer accounts and profiles
- Marketing and promotions
- Analytics and reporting

Regulatory considerations:
- PCI DSS compliance
- Consumer protection laws
- Tax regulations
- Data privacy laws
- E-commerce regulations

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, headers, or explanatory text. The response must be parsable JSON.

The JSON structure must be exactly as follows:
{
  "requirements": [
    {
      "id": "REQ_001",
      "title": "Requirement Title",
      "description": "Detailed description of the requirement",
      "priority": "critical|high|medium|low",
      "category": "category_name"
    }
  ],
  "features": [
    {
      "id": "FEAT_001",
      "name": "Feature Name",
      "description": "Detailed description of the feature",
      "complexity": "low|medium|high",
      "estimatedHours": 40,
      "category": "category_name"
    }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "assumptions": ["assumption 1", "assumption 2"],
  "risks": [
    {
      "description": "Risk description",
      "impact": "low|medium|high",
      "probability": "low|medium|high"
    }
  ],
  "priorities": [
    {
      "item": "priority item",
      "priority_level": "critical|high|medium|low",
      "justification": "reason for priority"
    }
  ],
  "dependencies": [
    {
      "from": "source item",
      "to": "target item",
      "type": "dependency_type"
    }
  ],
  "complexity": "low|medium|high",
  "duration": "days|weeks|months",
  "confidence": 0.8,
  "detectedDomain": "domain_name"
}

Return a comprehensive analysis with e-commerce-specific features and compliance requirements in valid JSON format only.`
  }
};

// Domain detection keywords
const domainKeywords = {
  kyc: ['kyc', 'know your customer', 'identity verification', 'customer verification', 'aml', 'anti-money laundering', 'compliance', 'due diligence', 'watchlist', 'sanctions'],
  banking: ['banking', 'bank', 'account', 'transaction', 'deposit', 'withdrawal', 'loan', 'mortgage'],
  finance: ['finance', 'financial', 'investment', 'portfolio', 'trading', 'stocks', 'bonds', 'analytics'],
  healthcare: ['healthcare', 'medical', 'patient', 'hospital', 'clinic', 'doctor', 'health', 'hipaa', 'ehr'],
  ecommerce: ['ecommerce', 'e-commerce', 'shopping', 'cart', 'checkout', 'payment', 'product', 'catalog', 'inventory', 'order']
};

// Detect domain from description
function detectDomain(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  let bestDomain = 'general';
  let maxMatches = 0;
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    const matches = keywords.filter(keyword => lowerDesc.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestDomain = domain;
    }
  }
  
  return bestDomain;
}

// AI-powered requirements analysis
async function analyzeRequirementsWithAI(description: string, projectType: string, detectedDomain: string) {
  try {
    const zai = await ZAI.create();
    
    const domainTemplate = domainTemplates[detectedDomain as keyof typeof domainTemplates];
    
    const systemPrompt = domainTemplate?.promptTemplate || `You are an expert business analyst and software architect specializing in ${detectedDomain === 'kyc' ? 'KYC and compliance systems' : detectedDomain === 'banking' ? 'banking applications' : detectedDomain === 'finance' ? 'financial applications' : detectedDomain === 'healthcare' ? 'healthcare applications' : detectedDomain === 'ecommerce' ? 'e-commerce platforms' : 'mobile applications'}.

Analyze the following project description and extract structured requirements. Focus on domain-specific features and requirements for ${detectedDomain.toUpperCase()} applications.

${domainTemplate ? `Domain Context: ${domainTemplate.name}
Key Features for this domain: ${domainTemplate.features.map(f => f.name).join(', ')}

Use these domain-specific features as inspiration but customize them based on the specific project description.` : ''}

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, headers, or explanatory text. The response must be parsable JSON.

Return a JSON object with:
- requirements: Array of functional requirements (each with id, title, description, priority, category)
- features: Array of specific features (each with id, name, description, complexity, estimatedHours, category)
- constraints: Array of technical or business constraints
- assumptions: Array of assumptions made during analysis
- risks: Array of potential risks (each with description, impact, probability)
- priorities: Array of priority items (each with item, priority_level, justification)
- dependencies: Array of dependencies (each with from, to, type)
- complexity: Overall complexity estimate (low, medium, high)
- duration: Estimated duration (days, weeks, months)
- confidence: Confidence in analysis (0-1)
- detectedDomain: The detected domain (${detectedDomain})

Priority levels: critical, high, medium, low
Complexity levels: low, medium, high
Risk impact levels: low, medium, high
Risk probability levels: low, medium, high

For ${detectedDomain.toUpperCase()} applications, focus on:
${detectedDomain === 'kyc' ? `- Regulatory compliance and security requirements
- Identity verification and authentication
- AML screening and monitoring
- Document management and validation
- Audit trails and reporting
- Integration with third-party verification services` : 
  detectedDomain === 'banking' ? `- Secure transaction processing
- Account management and security
- Payment processing and integration
- Regulatory compliance
- Fraud detection and prevention` :
  detectedDomain === 'finance' ? `- Financial data security
- Portfolio management and analytics
- Trading and investment features
- Regulatory compliance
- Risk management` :
  detectedDomain === 'healthcare' ? `- Patient data privacy and security
- HIPAA compliance and regulatory requirements
- Electronic health records management
- Clinical workflows and integration
- Telemedicine and remote care capabilities` :
  detectedDomain === 'ecommerce' ? `- User experience and conversion optimization
- Secure payment processing
- Inventory and order management
- Customer account management
- Marketing and analytics integration` :
  `- User experience and interface design
- Core application functionality
- Performance and scalability
- Security best practices`}

Remember: Return ONLY valid JSON without any formatting or explanation.`;

    // Add timeout to AI service call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI service timeout')), 30000); // 30 second timeout
    });

    const aiCallPromise = zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Project Description: ${description}\n\nProject Type: ${projectType}\n\nAnalyze this project and provide comprehensive requirements analysis with domain-specific features.`
        }
      ],
      max_tokens: 1500, // Reduced from 2000 to make it faster
      temperature: 0.3
    });

    let response;
    try {
      response = await Promise.race([aiCallPromise, timeoutPromise]) as any;
    } catch (timeoutError) {
      console.warn('AI service call timed out:', timeoutError);
      return await analyzeRequirementsRuleBased(description, projectType, detectedDomain);
    }

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        // Clean the content - remove markdown formatting and extract JSON
        let cleanContent = content.trim();
        
        // Remove markdown code blocks
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanContent = cleanContent.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
        
        // Remove markdown headers and formatting
        cleanContent = cleanContent.replace(/#{1,6}\s.*$/gm, ''); // Remove markdown headers
        cleanContent = cleanContent.replace(/^\s*[-*+]\s.*$/gm, ''); // Remove markdown lists
        cleanContent = cleanContent.replace(/^\s*\d+\.\s.*$/gm, ''); // Remove numbered lists
        cleanContent = cleanContent.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold formatting
        cleanContent = cleanContent.replace(/\*([^*]+)\*/g, '$1'); // Remove italic formatting
        
        // Remove explanatory text before and after JSON
        cleanContent = cleanContent.replace(/^[^{]*/, ''); // Remove everything before first {
        cleanContent = cleanContent.replace(/[^}]*$/, ''); // Remove everything after last }
        
        // Try to find JSON object in the content
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
        
        // Validate that the content looks like JSON
        if (!cleanContent.trim().startsWith('{') || !cleanContent.trim().endsWith('}')) {
          throw new Error('Content does not appear to be valid JSON');
        }
        
        // Fix common JSON issues
        cleanContent = cleanContent.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
        cleanContent = cleanContent.replace(/(\w+)\s*:/g, '"$1":'); // Quote unquoted property names
        cleanContent = cleanContent.replace(/:\s*'([^']*)'/g, ': "$1"'); // Convert single quotes to double quotes
        
        const analysis = JSON.parse(cleanContent);
        return {
          success: true,
          data: {
            ...analysis,
            projectType,
            detectedDomain,
            processedAt: new Date().toISOString()
          }
        };
      } catch (parseError) {
        console.warn('Failed to parse AI requirement analysis:', parseError);
        console.warn('Raw AI response:', content);
        return await analyzeRequirementsRuleBased(description, projectType, detectedDomain);
      }
    }

    return await analyzeRequirementsRuleBased(description, projectType, detectedDomain);
  } catch (error) {
    console.warn('AI requirement analysis failed:', error);
    return await analyzeRequirementsRuleBased(description, projectType, detectedDomain);
  }
}

// Rule-based requirement analysis fallback
function analyzeRequirementsRuleBased(description: string, projectType: string, detectedDomain: string) {
  const analysis = {
    projectType,
    detectedDomain,
    requirements: [],
    features: [],
    constraints: [],
    assumptions: [],
    risks: [],
    priorities: [],
    dependencies: [],
    complexity: 'medium',
    duration: 'weeks',
    confidence: 0.5
  };

  const lowerDesc = description.toLowerCase();
  const domainTemplate = domainTemplates[detectedDomain as keyof typeof domainTemplates];

  // Use domain-specific requirements if available
  if (domainTemplate && domainTemplate.requirements) {
    analysis.requirements = domainTemplate.requirements;
  } else {
    // Extract basic requirements
    if (lowerDesc.includes('user') || lowerDesc.includes('login') || lowerDesc.includes('auth')) {
      analysis.requirements.push({
        id: 'REQ_001',
        title: 'User Management',
        description: 'System should support user registration and authentication',
        priority: 'high',
        category: 'security'
      });
    }
    
    if (lowerDesc.includes('data') || lowerDesc.includes('storage') || lowerDesc.includes('database')) {
      analysis.requirements.push({
        id: 'REQ_002',
        title: 'Data Management',
        description: 'System should provide data storage and retrieval capabilities',
        priority: 'medium',
        category: 'data'
      });
    }
  }

  // Use domain-specific features if available
  if (domainTemplate && domainTemplate.features) {
    analysis.features = domainTemplate.features;
  } else {
    // Extract features
    const featureMap = [
      { keyword: 'fitness', name: 'Fitness Tracking', complexity: 'medium', hours: 25 },
      { keyword: 'payment', name: 'Payment Processing', complexity: 'high', hours: 45 },
      { keyword: 'social', name: 'Social Integration', complexity: 'medium', hours: 30 },
      { keyword: 'notification', name: 'Push Notifications', complexity: 'medium', hours: 20 },
      { keyword: 'camera', name: 'Camera Integration', complexity: 'high', hours: 35 }
    ];
    
    featureMap.forEach(({ keyword, name, complexity, hours }) => {
      if (lowerDesc.includes(keyword)) {
        analysis.features.push({
          id: `FEAT_${analysis.features.length + 1}`,
          name,
          description: `Include ${name.toLowerCase()} functionality`,
          complexity,
          estimatedHours: hours
        });
      }
    });
  }

  // Add domain-specific constraints
  if (detectedDomain === 'kyc') {
    analysis.constraints.push(
      'Must comply with KYC, AML, and GDPR regulations',
      'Requires integration with third-party verification services',
      'Need secure storage of sensitive personal data'
    );
    analysis.assumptions.push(
      'Access to identity verification APIs',
      'Customers have valid identification documents',
      'Regulatory requirements are clearly defined'
    );
    analysis.risks.push(
      {
        description: 'Regulatory changes may require system updates',
        impact: 'high',
        probability: 'medium'
      },
      {
        description: 'Data breaches could expose sensitive customer information',
        impact: 'high',
        probability: 'low'
      }
    );
  } else if (detectedDomain === 'healthcare') {
    analysis.constraints.push(
      'Must comply with HIPAA regulations',
      'Requires secure handling of protected health information (PHI)',
      'Need integration with healthcare systems and standards'
    );
    analysis.assumptions.push(
      'Access to healthcare APIs and systems',
      'Healthcare providers will use modern devices',
      'Patient consent processes are established'
    );
    analysis.risks.push(
      {
        description: 'HIPAA violations could result in significant fines',
        impact: 'high',
        probability: 'low'
      },
      {
        description: 'System downtime could affect patient care',
        impact: 'high',
        probability: 'low'
      }
    );
  } else if (detectedDomain === 'ecommerce') {
    analysis.constraints.push(
      'Must comply with PCI DSS requirements',
      'Need secure payment processing',
      'Requires inventory management integration'
    );
    analysis.assumptions.push(
      'Payment gateway APIs are available',
      'Products have proper descriptions and images',
      'Shipping and tax calculation services are accessible'
    );
    analysis.risks.push(
      {
        description: 'Payment processing failures could lost sales',
        impact: 'high',
        probability: 'medium'
      },
      {
        description: 'Security breaches could compromise customer data',
        impact: 'high',
        probability: 'low'
      }
    );
  } else {
    // Generic constraints
    if (lowerDesc.includes('budget') || lowerDesc.includes('cost')) {
      analysis.constraints.push('Budget limitations may affect feature scope');
    }

    if (lowerDesc.includes('timeline') || lowerDesc.includes('deadline')) {
      analysis.constraints.push('Timeline constraints may require prioritization');
    }

    // Add common assumptions
    analysis.assumptions.push(
      'Users will have modern smartphones',
      'Internet connectivity will be available',
      'Basic technical knowledge of target users'
    );

    // Add common risks
    analysis.risks.push(
      {
        description: 'Technical complexity may exceed initial estimates',
        impact: 'medium',
        probability: 'medium'
      },
      {
        description: 'User adoption may be lower than expected',
        impact: 'high',
        probability: 'low'
      }
    );
  }

  // Calculate complexity
  const totalHours = analysis.features.reduce((sum, f) => sum + (f.estimatedHours || 20), 0);
  let complexity = 'low';
  if (totalHours > 80) complexity = 'high';
  else if (totalHours > 40) complexity = 'medium';
  
  analysis.complexity = complexity;
  analysis.duration = totalHours > 60 ? 'months' : 'weeks';
  analysis.confidence = Math.min(0.9, 0.5 + (analysis.requirements.length + analysis.features.length) * 0.1);

  return {
    success: true,
    data: {
      ...analysis,
      processedAt: new Date().toISOString()
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Add overall timeout for the entire request
    const overallTimeout = setTimeout(() => {
      throw new Error('Request timeout');
    }, 45000); // 45 second overall timeout

    const body = await request.json();
    const { description, projectType = 'mobile-app' } = body;

    if (!description || typeof description !== 'string') {
      clearTimeout(overallTimeout);
      return NextResponse.json(
        { error: 'Invalid input', message: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    // Detect domain from description
    const detectedDomain = detectDomain(description);
    console.log(`Detected domain: ${detectedDomain}`);

    // Try AI-powered analysis first
    const aiResult = await analyzeRequirementsWithAI(description, projectType, detectedDomain);
    
    clearTimeout(overallTimeout);
    
    if (aiResult.success) {
      return NextResponse.json(aiResult);
    }

    // Fallback to rule-based analysis
    const ruleBasedResult = analyzeRequirementsRuleBased(description, projectType, detectedDomain);
    return NextResponse.json(ruleBasedResult);

  } catch (error) {
    console.error('Analyze requirements API error:', error);
    // Clear timeout if it exists
    if (typeof overallTimeout !== 'undefined') {
      clearTimeout(overallTimeout);
    }
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'Failed to analyze requirements',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}