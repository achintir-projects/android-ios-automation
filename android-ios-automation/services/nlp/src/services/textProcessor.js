const { openai, hf, logger } = require('../index');
const { AppError } = require('../middleware/errorHandler');

/**
 * Process text using multiple NLP techniques
 */
const processText = async (text, options = {}) => {
  try {
    const {
      includeSentiment = true,
      includeKeywords = true,
      includeSummary = true,
      includeLanguage = true,
      model = 'gpt-3.5-turbo'
    } = options;

    logger.info('Processing text with NLP', { 
      textLength: text.length, 
      options 
    });

    const results = {
      originalText: text,
      processedAt: new Date().toISOString()
    };

    // Language detection
    if (includeLanguage) {
      try {
        const language = await detectLanguage(text);
        results.language = language;
      } catch (error) {
        logger.warn('Language detection failed:', error);
        results.language = { language: 'unknown', confidence: 0 };
      }
    }

    // Sentiment analysis
    if (includeSentiment) {
      try {
        const sentiment = await analyzeSentiment(text);
        results.sentiment = sentiment;
      } catch (error) {
        logger.warn('Sentiment analysis failed:', error);
        results.sentiment = { sentiment: 'neutral', confidence: 0 };
      }
    }

    // Keyword extraction
    if (includeKeywords) {
      try {
        const keywords = await extractKeywords(text);
        results.keywords = keywords;
      } catch (error) {
        logger.warn('Keyword extraction failed:', error);
        results.keywords = [];
      }
    }

    // Text summarization
    if (includeSummary && text.length > 200) {
      try {
        const summary = await summarizeText(text, model);
        results.summary = summary;
      } catch (error) {
        logger.warn('Text summarization failed:', error);
        results.summary = text.substring(0, 200) + '...';
      }
    }

    // Text classification
    try {
      const classification = await classifyText(text);
      results.classification = classification;
    } catch (error) {
      logger.warn('Text classification failed:', error);
      results.classification = { category: 'general', confidence: 0 };
    }

    return results;

  } catch (error) {
    logger.error('Text processing failed:', error);
    throw new AppError('Text processing failed', 500);
  }
};

/**
 * Detect language of text
 */
const detectLanguage = async (text) => {
  try {
    // Use Hugging Face for language detection
    const response = await hf.textClassification({
      model: 'papluca/xlm-roberta-base-language-detection',
      inputs: text
    });

    const result = response[0];
    return {
      language: result.label,
      confidence: result.score
    };
  } catch (error) {
    // Fallback to simple language detection
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const words = text.toLowerCase().split(/\s+/);
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    const confidence = englishCount / words.length;
    
    return {
      language: confidence > 0.1 ? 'en' : 'unknown',
      confidence: Math.min(confidence, 1)
    };
  }
};

/**
 * Analyze sentiment of text
 */
const analyzeSentiment = async (text) => {
  try {
    // Use Hugging Face for sentiment analysis
    const response = await hf.textClassification({
      model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      inputs: text
    });

    const result = response[0];
    let sentiment = result.label.toLowerCase();
    
    // Normalize sentiment labels
    if (sentiment.includes('positive')) sentiment = 'positive';
    else if (sentiment.includes('negative')) sentiment = 'negative';
    else sentiment = 'neutral';

    return {
      sentiment,
      confidence: result.score,
      details: response
    };
  } catch (error) {
    // Fallback to simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'worst'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    let sentiment = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    return {
      sentiment,
      confidence: Math.abs(positiveCount - negativeCount) / words.length
    };
  }
};

/**
 * Extract keywords from text
 */
const extractKeywords = async (text) => {
  try {
    // Use OpenAI for keyword extraction
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Extract the most important keywords and phrases from the following text. Return them as a JSON array of strings.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const keywords = JSON.parse(content);
        return Array.isArray(keywords) ? keywords.slice(0, 10) : [];
      } catch (parseError) {
        // Fallback to simple keyword extraction
        return extractKeywordsSimple(text);
      }
    }
    
    return extractKeywordsSimple(text);
  } catch (error) {
    logger.warn('OpenAI keyword extraction failed, using fallback:', error);
    return extractKeywordsSimple(text);
  }
};

/**
 * Simple keyword extraction fallback
 */
const extractKeywordsSimple = (text) => {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
};

/**
 * Summarize text
 */
const summarizeText = async (text, model = 'gpt-3.5-turbo') => {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Summarize the following text in a concise and informative way, keeping the key points and main ideas.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 200,
      temperature: 0.5
    });

    return response.choices[0]?.message?.content?.trim() || text.substring(0, 200) + '...';
  } catch (error) {
    logger.warn('Text summarization failed:', error);
    return text.substring(0, 200) + '...';
  }
};

/**
 * Classify text into categories
 */
const classifyText = async (text) => {
  try {
    // Use Hugging Face for zero-shot classification
    const response = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: {
        candidate_labels: ['mobile app', 'website', 'software', 'game', 'business', 'education', 'entertainment', 'utility']
      }
    });

    const topResult = response.labels[0];
    return {
      category: topResult,
      confidence: response.scores[0],
      allCategories: response.labels.map((label, index) => ({
        category: label,
        confidence: response.scores[index]
      }))
    };
  } catch (error) {
    logger.warn('Text classification failed:', error);
    return {
      category: 'general',
      confidence: 0.5
    };
  }
};

module.exports = {
  processText,
  detectLanguage,
  analyzeSentiment,
  extractKeywords,
  summarizeText,
  classifyText
};