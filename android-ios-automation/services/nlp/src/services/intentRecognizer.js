const { openai, hf, logger } = require('../index');
const { AppError } = require('../middleware/errorHandler');

/**
 * Recognize user intent from text
 */
const recognizeIntent = async (text, context = {}) => {
  try {
    logger.info('Recognizing intent', { textLength: text.length, contextKeys: Object.keys(context) });

    const results = {
      text,
      intent: null,
      confidence: 0,
      entities: [],
      action: null,
      parameters: {},
      context: context,
      processedAt: new Date().toISOString()
    };

    // Primary intent recognition using OpenAI
    const intentResult = await recognizeIntentWithOpenAI(text, context);
    results.intent = intentResult.intent;
    results.confidence = intentResult.confidence;
    results.action = intentResult.action;
    results.parameters = intentResult.parameters;

    // Secondary validation using Hugging Face
    try {
      const validationResult = await validateIntentWithHuggingFace(text, results.intent);
      if (validationResult.confidence > results.confidence) {
        results.intent = validationResult.intent;
        results.confidence = validationResult.confidence;
      }
    } catch (error) {
      logger.warn('Hugging Face intent validation failed:', error);
    }

    // Extract entities for the recognized intent
    results.entities = await extractIntentEntities(text, results.intent);

    return results;
  } catch (error) {
    logger.error('Intent recognition failed:', error);
    throw new AppError('Intent recognition failed', 500);
  }
};

/**
 * Recognize intent using OpenAI
 */
const recognizeIntentWithOpenAI = async (text, context) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an intent recognition system for a mobile app development platform. 
          Analyze the user's input and determine their intent. 

          Return a JSON object with:
          - intent: The main intent category
          - confidence: Confidence score (0-1)
          - action: Specific action to take
          - parameters: Extracted parameters as key-value pairs

          Common intents for mobile app development:
          - create_app: User wants to create a new mobile app
          - modify_app: User wants to modify an existing app
          - add_feature: User wants to add a feature to an app
          - remove_feature: User wants to remove a feature
          - generate_code: User wants to generate code
          - deploy_app: User wants to deploy an app
          - test_app: User wants to test an app
          - get_help: User needs help or has questions
          - provide_feedback: User is providing feedback
          - request_info: User wants information about something`
        },
        {
          role: 'user',
          content: `Context: ${JSON.stringify(context)}\n\nUser input: ${text}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        logger.warn('Failed to parse OpenAI intent response:', parseError);
        return await recognizeIntentRuleBased(text);
      }
    }

    return await recognizeIntentRuleBased(text);
  } catch (error) {
    logger.warn('OpenAI intent recognition failed:', error);
    return await recognizeIntentRuleBased(text);
  }
};

/**
 * Rule-based intent recognition fallback
 */
const recognizeIntentRuleBased = async (text) => {
  const lowerText = text.toLowerCase();
  
  const intentPatterns = [
    {
      intent: 'create_app',
      patterns: ['create', 'build', 'make', 'develop', 'new app', 'start'],
      confidence: 0.7,
      action: 'initialize_app_creation'
    },
    {
      intent: 'add_feature',
      patterns: ['add', 'include', 'want', 'need', 'feature', 'functionality'],
      confidence: 0.6,
      action: 'add_feature_to_app'
    },
    {
      intent: 'generate_code',
      patterns: ['generate', 'code', 'implement', 'write', 'develop'],
      confidence: 0.8,
      action: 'generate_app_code'
    },
    {
      intent: 'deploy_app',
      patterns: ['deploy', 'publish', 'release', 'launch', 'store'],
      confidence: 0.9,
      action: 'deploy_application'
    },
    {
      intent: 'test_app',
      patterns: ['test', 'check', 'verify', 'validate', 'debug'],
      confidence: 0.8,
      action: 'run_app_tests'
    },
    {
      intent: 'get_help',
      patterns: ['help', 'how', 'guide', 'tutorial', 'assist'],
      confidence: 0.7,
      action: 'provide_help'
    },
    {
      intent: 'provide_feedback',
      patterns: ['feedback', 'opinion', 'suggest', 'improvement', 'issue'],
      confidence: 0.6,
      action: 'collect_feedback'
    },
    {
      intent: 'request_info',
      patterns: ['what', 'when', 'where', 'why', 'how', 'information'],
      confidence: 0.5,
      action: 'provide_information'
    }
  ];

  let bestMatch = {
    intent: 'unknown',
    confidence: 0.3,
    action: 'handle_unknown_intent',
    parameters: {}
  };

  intentPatterns.forEach(pattern => {
    const matchCount = pattern.patterns.filter(p => lowerText.includes(p)).length;
    if (matchCount > 0) {
      const confidence = Math.min(1, pattern.confidence + (matchCount * 0.1));
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          intent: pattern.intent,
          confidence,
          action: pattern.action,
          parameters: extractParametersFromText(text, pattern.intent)
        };
      }
    }
  });

  return bestMatch;
};

/**
 * Extract parameters from text based on intent
 */
const extractParametersFromText = (text, intent) => {
  const parameters = {};
  const lowerText = text.toLowerCase();

  switch (intent) {
    case 'create_app':
      // Extract app name, platform, type
      const appNameMatch = text.match(/(?:called|named)\s+([^.!?]+)/i);
      if (appNameMatch) {
        parameters.appName = appNameMatch[1].trim();
      }

      const platformMatch = text.match(/(?:for|on)\s+(ios|android|web|both)/i);
      if (platformMatch) {
        parameters.platform = platformMatch[1].toLowerCase();
      }

      const typeMatch = text.match(/(?:app|application)\s+(?:of|for|about)\s+([^.!?]+)/i);
      if (typeMatch) {
        parameters.appType = typeMatch[1].trim();
      }
      break;

    case 'add_feature':
      // Extract feature name, description
      const featureMatch = text.match(/(?:add|include)\s+([^.!?]+)/i);
      if (featureMatch) {
        parameters.featureName = featureMatch[1].trim();
      }
      break;

    case 'deploy_app':
      // Extract deployment target, environment
      const targetMatch = text.match(/(?:deploy|publish)\s+(?:to|on)\s+([^.!?]+)/i);
      if (targetMatch) {
        parameters.target = targetMatch[1].trim();
      }
      break;

    default:
      // Generic parameter extraction
      const numbers = text.match(/\d+/g);
      if (numbers) {
        parameters.numbers = numbers;
      }
  }

  return parameters;
};

/**
 * Validate intent using Hugging Face
 */
const validateIntentWithHuggingFace = async (text, predictedIntent) => {
  try {
    // Use zero-shot classification to validate intent
    const response = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: {
        candidate_labels: [
          'create_app', 'modify_app', 'add_feature', 'remove_feature',
          'generate_code', 'deploy_app', 'test_app', 'get_help',
          'provide_feedback', 'request_info'
        ]
      }
    });

    const topResult = response.labels[0];
    return {
      intent: topResult,
      confidence: response.scores[0]
    };
  } catch (error) {
    logger.warn('Hugging Face intent validation failed:', error);
    return {
      intent: predictedIntent,
      confidence: 0.5
    };
  }
};

/**
 * Extract entities specific to the recognized intent
 */
const extractIntentEntities = async (text, intent) => {
  const entities = [];

  switch (intent) {
    case 'create_app':
      entities.push(...await extractAppCreationEntities(text));
      break;
    case 'add_feature':
      entities.push(...await extractFeatureEntities(text));
      break;
    case 'deploy_app':
      entities.push(...await extractDeploymentEntities(text));
      break;
    default:
      entities.push(...await extractGeneralIntentEntities(text));
  }

  return entities;
};

/**
 * Extract app creation entities
 */
const extractAppCreationEntities = async (text) => {
  const entities = [];
  const lowerText = text.toLowerCase();

  // App name
  const appNamePatterns = [
    /(?:called|named)\s+([^.!?]+)/i,
    /(?:app|application)\s+called\s+([^.!?]+)/i,
    /create\s+([^.!?]+)\s+app/i
  ];

  appNamePatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      entities.push({
        type: 'app_name',
        text: match[1].trim(),
        confidence: 0.8
      });
    }
  });

  // Platform
  const platforms = ['ios', 'android', 'web', 'cross-platform'];
  platforms.forEach(platform => {
    if (lowerText.includes(platform)) {
      entities.push({
        type: 'platform',
        text: platform,
        confidence: 0.9
      });
    }
  });

  // App type
  const appTypes = ['game', 'social', 'business', 'education', 'utility', 'ecommerce'];
  appTypes.forEach(type => {
    if (lowerText.includes(type)) {
      entities.push({
        type: 'app_type',
        text: type,
        confidence: 0.7
      });
    }
  });

  return entities;
};

/**
 * Extract feature entities
 */
const extractFeatureEntities = async (text) => {
  const entities = [];
  const lowerText = text.toLowerCase();

  const features = [
    'login', 'registration', 'profile', 'dashboard', 'settings',
    'payment', 'search', 'notification', 'camera', 'gps',
    'social media', 'messaging', 'chat', 'reviews'
  ];

  features.forEach(feature => {
    if (lowerText.includes(feature)) {
      entities.push({
        type: 'feature',
        text: feature,
        confidence: 0.8
      });
    }
  });

  return entities;
};

/**
 * Extract deployment entities
 */
const extractDeploymentEntities = async (text) => {
  const entities = [];
  const lowerText = text.toLowerCase();

  const deploymentTargets = ['app store', 'play store', 'google play', 'testflight', 'production'];
  deploymentTargets.forEach(target => {
    if (lowerText.includes(target)) {
      entities.push({
        type: 'deployment_target',
        text: target,
        confidence: 0.9
      });
    }
  });

  const environments = ['staging', 'production', 'development', 'testing'];
  environments.forEach(env => {
    if (lowerText.includes(env)) {
      entities.push({
        type: 'environment',
        text: env,
        confidence: 0.8
      });
    }
  });

  return entities;
};

/**
 * Extract general intent entities
 */
const extractGeneralIntentEntities = async (text) => {
  const entities = [];

  // Extract numbers
  const numbers = text.match(/\d+/g);
  if (numbers) {
    numbers.forEach(num => {
      entities.push({
        type: 'number',
        text: num,
        confidence: 1.0
      });
    });
  }

  // Extract dates
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/;
  const dateMatch = text.match(datePattern);
  if (dateMatch) {
    entities.push({
      type: 'date',
      text: dateMatch[0],
      confidence: 0.9
    });
  }

  return entities;
};

/**
 * Get intent statistics
 */
const getIntentStats = (intents) => {
  const stats = {
    total: intents.length,
    byIntent: {},
    avgConfidence: 0,
    topIntent: null
  };

  intents.forEach(intent => {
    stats.byIntent[intent.intent] = (stats.byIntent[intent.intent] || 0) + 1;
    stats.avgConfidence += intent.confidence;
  });

  stats.avgConfidence = intents.length > 0 ? stats.avgConfidence / intents.length : 0;

  // Find top intent
  let maxCount = 0;
  Object.entries(stats.byIntent).forEach(([intent, count]) => {
    if (count > maxCount) {
      maxCount = count;
      stats.topIntent = intent;
    }
  });

  return stats;
};

module.exports = {
  recognizeIntent,
  recognizeIntentWithOpenAI,
  recognizeIntentRuleBased,
  validateIntentWithHuggingFace,
  extractIntentEntities,
  getIntentStats
};