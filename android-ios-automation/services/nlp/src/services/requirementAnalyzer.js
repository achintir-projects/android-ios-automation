const { openai, logger } = require('../index');
const { AppError } = require('../middleware/errorHandler');

/**
 * Analyze requirements from natural language description
 */
const analyzeRequirements = async (description, projectType = 'mobile-app') => {
  try {
    logger.info('Analyzing requirements', { descriptionLength: description.length, projectType });

    const analysis = {
      projectType,
      description,
      requirements: [],
      features: [],
      constraints: [],
      assumptions: [],
      risks: [],
      priorities: [],
      dependencies: [],
      estimatedComplexity: 'medium',
      estimatedDuration: 'weeks',
      confidence: 0,
      processedAt: new Date().toISOString()
    };

    // Primary analysis using OpenAI
    const aiAnalysis = await analyzeRequirementsWithAI(description, projectType);
    
    // Merge AI analysis with structured analysis
    analysis.requirements = aiAnalysis.requirements || [];
    analysis.features = aiAnalysis.features || [];
    analysis.constraints = aiAnalysis.constraints || [];
    analysis.assumptions = aiAnalysis.assumptions || [];
    analysis.risks = aiAnalysis.risks || [];
    analysis.priorities = aiAnalysis.priorities || [];
    analysis.dependencies = aiAnalysis.dependencies || [];
    analysis.estimatedComplexity = aiAnalysis.complexity || 'medium';
    analysis.estimatedDuration = aiAnalysis.duration || 'weeks';
    analysis.confidence = aiAnalysis.confidence || 0.7;

    // Validate and enhance analysis
    const enhancedAnalysis = await enhanceRequirementAnalysis(analysis);
    
    return enhancedAnalysis;
  } catch (error) {
    logger.error('Requirement analysis failed:', error);
    throw new AppError('Requirement analysis failed', 500);
  }
};

/**
 * Analyze requirements using AI
 */
const analyzeRequirementsWithAI = async (description, projectType) => {
  try {
    const systemPrompt = `You are an expert business analyst and software architect specializing in ${projectType} development. 
    Analyze the following project description and extract structured requirements.

    Return a JSON object with:
    - requirements: Array of functional requirements (each with id, title, description, priority, category)
    - features: Array of specific features (each with id, name, description, complexity, estimatedHours)
    - constraints: Array of technical or business constraints
    - assumptions: Array of assumptions made during analysis
    - risks: Array of potential risks (each with description, impact, probability)
    - priorities: Array of priority items (each with item, priority_level, justification)
    - dependencies: Array of dependencies (each with from, to, type)
    - complexity: Overall complexity estimate (low, medium, high)
    - duration: Estimated duration (days, weeks, months)
    - confidence: Confidence in analysis (0-1)

    Priority levels: critical, high, medium, low
    Complexity levels: low, medium, high
    Risk impact levels: low, medium, high
    Risk probability levels: low, medium, high`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: description
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
        logger.warn('Failed to parse AI requirement analysis:', parseError);
        return await analyzeRequirementsRuleBased(description, projectType);
      }
    }

    return await analyzeRequirementsRuleBased(description, projectType);
  } catch (error) {
    logger.warn('AI requirement analysis failed:', error);
    return await analyzeRequirementsRuleBased(description, projectType);
  }
};

/**
 * Rule-based requirement analysis fallback
 */
const analyzeRequirementsRuleBased = async (description, projectType) => {
  const analysis = {
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

  // Extract basic requirements
  if (lowerDesc.includes('user') || lowerDesc.includes('login')) {
    analysis.requirements.push({
      id: 'REQ_001',
      title: 'User Management',
      description: 'System should support user registration and authentication',
      priority: 'high',
      category: 'security'
    });
  }

  if (lowerDesc.includes('data') || lowerDesc.includes('database')) {
    analysis.requirements.push({
      id: 'REQ_002',
      title: 'Data Management',
      description: 'System should provide data storage and retrieval capabilities',
      priority: 'medium',
      category: 'data'
    });
  }

  // Extract features
  const commonFeatures = [
    { keyword: 'notification', name: 'Push Notifications', complexity: 'medium' },
    { keyword: 'camera', name: 'Camera Integration', complexity: 'high' },
    { keyword: 'gps', name: 'Location Services', complexity: 'medium' },
    { keyword: 'payment', name: 'Payment Processing', complexity: 'high' },
    { keyword: 'social', name: 'Social Media Integration', complexity: 'medium' },
    { keyword: 'offline', name: 'Offline Mode', complexity: 'high' }
  ];

  commonFeatures.forEach(feature => {
    if (lowerDesc.includes(feature.keyword)) {
      analysis.features.push({
        id: `FEAT_${analysis.features.length + 1}`,
        name: feature.name,
        description: `Include ${feature.name} functionality`,
        complexity: feature.complexity,
        estimatedHours: feature.complexity === 'high' ? 40 : feature.complexity === 'medium' ? 20 : 10
      });
    }
  });

  // Extract constraints
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

  return analysis;
};

/**
 * Enhance requirement analysis with additional processing
 */
const enhanceRequirementAnalysis = async (analysis) => {
  try {
    // Validate requirements
    analysis.requirements = validateRequirements(analysis.requirements);

    // Categorize features
    analysis.features = categorizeFeatures(analysis.features);

    // Assess risks more thoroughly
    analysis.risks = assessRisks(analysis.risks);

    // Calculate overall confidence
    analysis.confidence = calculateAnalysisConfidence(analysis);

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);

    return analysis;
  } catch (error) {
    logger.warn('Requirement enhancement failed:', error);
    return analysis;
  }
};

/**
 * Validate requirements
 */
const validateRequirements = (requirements) => {
  return requirements.map((req, index) => ({
    ...req,
    id: req.id || `REQ_${String(index + 1).padStart(3, '0')}`,
    title: req.title || `Requirement ${index + 1}`,
    description: req.description || 'No description provided',
    priority: req.priority || 'medium',
    category: req.category || 'general',
    validated: true
  }));
};

/**
 * Categorize features
 */
const categorizeFeatures = (features) => {
  return features.map((feature, index) => {
    let category = 'general';
    
    if (feature.name.toLowerCase().includes('security') || feature.name.toLowerCase().includes('auth')) {
      category = 'security';
    } else if (feature.name.toLowerCase().includes('user') || feature.name.toLowerCase().includes('profile')) {
      category = 'user_management';
    } else if (feature.name.toLowerCase().includes('data') || feature.name.toLowerCase().includes('storage')) {
      category = 'data';
    } else if (feature.name.toLowerCase().includes('payment') || feature.name.toLowerCase().includes('billing')) {
      category = 'monetization';
    }

    return {
      ...feature,
      id: feature.id || `FEAT_${String(index + 1).padStart(3, '0')}`,
      category,
      estimatedHours: feature.estimatedHours || 20
    };
  });
};

/**
 * Assess risks more thoroughly
 */
const assessRisks = (risks) => {
  return risks.map((risk, index) => {
    const impact = risk.impact || 'medium';
    const probability = risk.probability || 'medium';
    
    // Calculate risk score
    const impactScore = { low: 1, medium: 2, high: 3 }[impact];
    const probabilityScore = { low: 1, medium: 2, high: 3 }[probability];
    const riskScore = impactScore * probabilityScore;
    
    let severity = 'low';
    if (riskScore >= 6) severity = 'high';
    else if (riskScore >= 3) severity = 'medium';

    return {
      ...risk,
      id: `RISK_${String(index + 1).padStart(3, '0')}`,
      severity,
      riskScore,
      mitigation: generateRiskMitigation(risk.description, severity)
    };
  });
};

/**
 * Generate risk mitigation strategies
 */
const generateRiskMitigation = (riskDescription, severity) => {
  const mitigations = {
    high: [
      'Develop detailed risk management plan',
      'Allocate additional resources',
      'Implement continuous monitoring',
      'Prepare contingency plans'
    ],
    medium: [
      'Monitor risk indicators',
      'Develop mitigation strategies',
      'Regular progress reviews'
    ],
    low: [
      'Monitor periodically',
      'Document risk',
      'Include in project planning'
    ]
  };

  return mitigations[severity] || mitigations.medium;
};

/**
 * Calculate analysis confidence
 */
const calculateAnalysisConfidence = (analysis) => {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on requirements quality
  if (analysis.requirements.length > 0) confidence += 0.1;
  if (analysis.requirements.every(req => req.description && req.description.length > 20)) confidence += 0.1;

  // Increase confidence based on feature details
  if (analysis.features.length > 0) confidence += 0.1;
  if (analysis.features.every(feat => feat.estimatedHours > 0)) confidence += 0.1;

  // Increase confidence based on risk assessment
  if (analysis.risks.length > 0) confidence += 0.1;

  return Math.min(1, confidence);
};

/**
 * Generate recommendations
 */
const generateRecommendations = (analysis) => {
  const recommendations = [];

  // Feature-based recommendations
  if (analysis.features.some(f => f.complexity === 'high')) {
    recommendations.push({
      type: 'complexity',
      priority: 'high',
      message: 'Consider breaking down high-complexity features into smaller, manageable components'
    });
  }

  // Risk-based recommendations
  if (analysis.risks.some(r => r.severity === 'high')) {
    recommendations.push({
      type: 'risk',
      priority: 'high',
      message: 'Develop comprehensive risk mitigation strategies for high-severity risks'
    });
  }

  // Timeline-based recommendations
  if (analysis.estimatedDuration === 'months') {
    recommendations.push({
      type: 'planning',
      priority: 'medium',
      message: 'Consider implementing phased delivery to demonstrate progress early'
    });
  }

  // Priority-based recommendations
  if (analysis.requirements.some(r => r.priority === 'critical')) {
    recommendations.push({
      type: 'priority',
      priority: 'high',
      message: 'Ensure critical requirements are addressed first and have dedicated resources'
    });
  }

  return recommendations;
};

/**
 * Get requirement statistics
 */
const getRequirementStats = (analysis) => {
  const stats = {
    totalRequirements: analysis.requirements.length,
    totalFeatures: analysis.features.length,
    totalRisks: analysis.risks.length,
    totalConstraints: analysis.constraints.length,
    requirementsByPriority: {},
    featuresByComplexity: {},
    risksBySeverity: {},
    estimatedTotalHours: 0,
    riskScore: 0
  };

  // Count requirements by priority
  analysis.requirements.forEach(req => {
    stats.requirementsByPriority[req.priority] = (stats.requirementsByPriority[req.priority] || 0) + 1;
  });

  // Count features by complexity
  analysis.features.forEach(feat => {
    stats.featuresByComplexity[feat.complexity] = (stats.featuresByComplexity[feat.complexity] || 0) + 1;
    stats.estimatedTotalHours += feat.estimatedHours || 0;
  });

  // Count risks by severity
  analysis.risks.forEach(risk => {
    stats.risksBySeverity[risk.severity] = (stats.risksBySeverity[risk.severity] || 0) + 1;
    stats.riskScore += risk.riskScore || 0;
  });

  return stats;
};

module.exports = {
  analyzeRequirements,
  analyzeRequirementsWithAI,
  analyzeRequirementsRuleBased,
  enhanceRequirementAnalysis,
  getRequirementStats
};