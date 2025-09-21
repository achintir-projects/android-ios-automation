const { openai, hf, logger } = require('../index');
const { AppError } = require('../middleware/errorHandler');

/**
 * Extract entities from text based on domain
 */
const extractEntities = async (text, domain = 'mobile-app') => {
  try {
    logger.info('Extracting entities', { textLength: text.length, domain });

    const results = {
      domain,
      entities: [],
      relationships: [],
      confidence: 0,
      processedAt: new Date().toISOString()
    };

    // Extract entities based on domain
    switch (domain) {
      case 'mobile-app':
        results.entities = await extractMobileAppEntities(text);
        break;
      case 'web-app':
        results.entities = await extractWebAppEntities(text);
        break;
      case 'software':
        results.entities = await extractSoftwareEntities(text);
        break;
      default:
        results.entities = await extractGeneralEntities(text);
    }

    // Extract relationships between entities
    results.relationships = await extractRelationships(text, results.entities);

    // Calculate overall confidence
    results.confidence = calculateConfidence(results.entities);

    return results;
  } catch (error) {
    logger.error('Entity extraction failed:', error);
    throw new AppError('Entity extraction failed', 500);
  }
};

/**
 * Extract mobile app specific entities
 */
const extractMobileAppEntities = async (text) => {
  try {
    const entities = [];

    // Use OpenAI for structured entity extraction
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Extract mobile app development entities from the following text. 
          Return a JSON object with these categories:
          - appFeatures: Array of app features
          - platforms: Array of target platforms (iOS, Android, etc.)
          - technologies: Array of technologies mentioned
          - userRoles: Array of user roles
          - dataTypes: Array of data types to be handled
          - integrations: Array of third-party integrations
          - screens: Array of app screens/pages
          - requirements: Array of functional requirements`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        
        // Convert to standard entity format
        Object.entries(parsed).forEach(([category, items]) => {
          if (Array.isArray(items)) {
            items.forEach((item, index) => {
              entities.push({
                id: `${category}_${index}`,
                type: category,
                text: typeof item === 'string' ? item : item.name || item.toString(),
                confidence: 0.8,
                metadata: typeof item === 'object' ? item : {},
                category: 'mobile-app'
              });
            });
          }
        });
      } catch (parseError) {
        logger.warn('Failed to parse OpenAI entity response:', parseError);
      }
    }

    // Fallback to rule-based extraction
    if (entities.length === 0) {
      entities.push(...await extractMobileAppEntitiesRuleBased(text));
    }

    return entities;
  } catch (error) {
    logger.warn('OpenAI entity extraction failed, using fallback:', error);
    return await extractMobileAppEntitiesRuleBased(text);
  }
};

/**
 * Rule-based mobile app entity extraction
 */
const extractMobileAppEntitiesRuleBased = async (text) => {
  const entities = [];
  const lowerText = text.toLowerCase();

  // Platform detection
  const platforms = ['ios', 'android', 'web', 'cross-platform', 'hybrid'];
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

  // Common app features
  const features = [
    'login', 'registration', 'profile', 'dashboard', 'settings', 'notifications',
    'search', 'filter', 'sorting', 'pagination', 'upload', 'download',
    'payment', 'checkout', 'cart', 'wishlist', 'reviews', 'ratings',
    'social', 'sharing', 'messaging', 'chat', 'comments', 'likes',
    'map', 'location', 'gps', 'camera', 'gallery', 'audio', 'video'
  ];

  features.forEach(feature => {
    if (lowerText.includes(feature)) {
      entities.push({
        id: `feature_${feature}`,
        type: 'appFeatures',
        text: feature,
        confidence: 0.6,
        category: 'mobile-app'
      });
    }
  });

  // Technology detection
  const technologies = [
    'react native', 'flutter', 'swift', 'kotlin', 'java', 'objective-c',
    'firebase', 'aws', 'azure', 'google cloud', 'mongodb', 'postgresql',
    'mysql', 'redis', 'node.js', 'express', 'django', 'flask'
  ];

  technologies.forEach(tech => {
    if (lowerText.includes(tech)) {
      entities.push({
        id: `tech_${tech.replace(/\s+/g, '_')}`,
        type: 'technologies',
        text: tech,
        confidence: 0.8,
        category: 'mobile-app'
      });
    }
  });

  return entities;
};

/**
 * Extract web app specific entities
 */
const extractWebAppEntities = async (text) => {
  try {
    const entities = [];

    // Use Hugging Face NER for general entities
    const response = await hf.tokenClassification({
      model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
      inputs: text
    });

    response.forEach((entity, index) => {
      entities.push({
        id: `web_${index}`,
        type: mapNERToWebType(entity.entity_group),
        text: entity.word,
        confidence: entity.score,
        category: 'web-app',
        start: entity.start,
        end: entity.end
      });
    });

    // Add web-specific entities
    const webEntities = await extractWebSpecificEntities(text);
    entities.push(...webEntities);

    return entities;
  } catch (error) {
    logger.warn('Hugging Face NER failed, using fallback:', error);
    return await extractWebAppEntitiesRuleBased(text);
  }
};

/**
 * Map NER labels to web app types
 */
const mapNERToWebType = (nerLabel) => {
  const mapping = {
    'PER': 'user',
    'ORG': 'organization',
    'LOC': 'location',
    'MISC': 'miscellaneous'
  };
  return mapping[nerLabel] || 'unknown';
};

/**
 * Extract web-specific entities
 */
const extractWebSpecificEntities = async (text) => {
  const entities = [];
  const lowerText = text.toLowerCase();

  const webFeatures = [
    'responsive design', 'pwa', 'spa', 'ssr', 'cms', 'ecommerce',
    'blog', 'forum', 'portfolio', 'landing page', 'admin panel'
  ];

  webFeatures.forEach(feature => {
    if (lowerText.includes(feature)) {
      entities.push({
        id: `web_feature_${feature.replace(/\s+/g, '_')}`,
        type: 'features',
        text: feature,
        confidence: 0.7,
        category: 'web-app'
      });
    }
  });

  return entities;
};

/**
 * Extract software specific entities
 */
const extractSoftwareEntities = async (text) => {
  const entities = [];

  // Use OpenAI for software entity extraction
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Extract software development entities from the following text.
          Focus on: programming languages, frameworks, databases, APIs, tools,
          methodologies, and technical requirements. Return as JSON array.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          parsed.forEach((item, index) => {
            entities.push({
              id: `software_${index}`,
              type: 'technical',
              text: typeof item === 'string' ? item : item.name || item.toString(),
              confidence: 0.7,
              category: 'software',
              metadata: typeof item === 'object' ? item : {}
            });
          });
        }
      } catch (parseError) {
        logger.warn('Failed to parse software entities:', parseError);
      }
    }
  } catch (error) {
    logger.warn('OpenAI software entity extraction failed:', error);
  }

  return entities;
};

/**
 * Extract general entities
 */
const extractGeneralEntities = async (text) => {
  try {
    const entities = [];

    // Use Hugging Face for general NER
    const response = await hf.tokenClassification({
      model: 'dslim/bert-base-NER',
      inputs: text
    });

    response.forEach((entity, index) => {
      entities.push({
        id: `general_${index}`,
        type: entity.entity_group || entity.entity,
        text: entity.word,
        confidence: entity.score,
        category: 'general',
        start: entity.start,
        end: entity.end
      });
    });

    return entities;
  } catch (error) {
    logger.warn('General NER failed:', error);
    return [];
  }
};

/**
 * Extract relationships between entities
 */
const extractRelationships = async (text, entities) => {
  const relationships = [];

  // Simple relationship extraction based on co-occurrence
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entity1 = entities[i];
      const entity2 = entities[j];
      
      // Check if entities appear close to each other in text
      const distance = Math.abs((entity1.start || 0) - (entity2.start || 0));
      if (distance < 100) { // Within 100 characters
        relationships.push({
          from: entity1.id,
          to: entity2.id,
          type: 'related',
          confidence: Math.max(0.3, 1 - (distance / 100)),
          context: text.substring(
            Math.min(entity1.start || 0, entity2.start || 0),
            Math.max((entity1.end || text.length), (entity2.end || text.length))
          )
        });
      }
    }
  }

  return relationships;
};

/**
 * Calculate confidence score for entities
 */
const calculateConfidence = (entities) => {
  if (entities.length === 0) return 0;
  
  const avgConfidence = entities.reduce((sum, entity) => sum + (entity.confidence || 0), 0) / entities.length;
  return Math.min(1, avgConfidence);
};

/**
 * Get entity statistics
 */
const getEntityStats = (entities) => {
  const stats = {
    total: entities.length,
    byType: {},
    byCategory: {},
    avgConfidence: 0
  };

  entities.forEach(entity => {
    // Count by type
    stats.byType[entity.type] = (stats.byType[entity.type] || 0) + 1;
    
    // Count by category
    stats.byCategory[entity.category] = (stats.byCategory[entity.category] || 0) + 1;
    
    // Sum confidence
    stats.avgConfidence += entity.confidence || 0;
  });

  stats.avgConfidence = entities.length > 0 ? stats.avgConfidence / entities.length : 0;

  return stats;
};

module.exports = {
  extractEntities,
  extractMobileAppEntities,
  extractWebAppEntities,
  extractSoftwareEntities,
  extractGeneralEntities,
  extractRelationships,
  getEntityStats
};