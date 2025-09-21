const express = require('express');
const router = express.Router();
const { openai, hf, logger } = require('../index');
const { processText } = require('../services/textProcessor');
const { processSpeech } = require('../services/speechProcessor');
const { extractEntities } = require('../services/entityExtractor');
const { recognizeIntent } = require('../services/intentRecognizer');
const { analyzeRequirements } = require('../services/requirementAnalyzer');
const { generateSpecs } = require('../services/specGenerator');
const { cacheResponse, getCachedResponse } = require('../utils/cache');

// Text processing endpoint
router.post('/process-text', async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text is required and must be a string'
      });
    }

    // Check cache first
    const cacheKey = `text:${text}:${JSON.stringify(options)}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      logger.info('Returning cached response for text processing');
      return res.json(cached);
    }

    logger.info('Processing text input', { textLength: text.length, options });

    // Process text using NLP services
    const result = await processText(text, options);

    // Cache the response
    await cacheResponse(cacheKey, result);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error processing text:', error);
    res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
});

// Speech-to-text endpoint
router.post('/speech-to-text', async (req, res) => {
  try {
    const { audioData, language = 'en' } = req.body;
    
    if (!audioData) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Audio data is required'
      });
    }

    logger.info('Processing speech input', { language, audioSize: audioData.length });

    // Process speech to text
    const result = await processSpeech(audioData, language);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error processing speech:', error);
    res.status(500).json({
      error: 'Speech processing failed',
      message: error.message
    });
  }
});

// Entity extraction endpoint
router.post('/extract-entities', async (req, res) => {
  try {
    const { text, domain = 'mobile-app' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text is required and must be a string'
      });
    }

    logger.info('Extracting entities', { textLength: text.length, domain });

    // Extract entities
    const entities = await extractEntities(text, domain);

    res.json({
      success: true,
      data: entities,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error extracting entities:', error);
    res.status(500).json({
      error: 'Entity extraction failed',
      message: error.message
    });
  }
});

// Intent recognition endpoint
router.post('/recognize-intent', async (req, res) => {
  try {
    const { text, context = {} } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text is required and must be a string'
      });
    }

    logger.info('Recognizing intent', { textLength: text.length });

    // Recognize intent
    const intent = await recognizeIntent(text, context);

    res.json({
      success: true,
      data: intent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error recognizing intent:', error);
    res.status(500).json({
      error: 'Intent recognition failed',
      message: error.message
    });
  }
});

// Requirement analysis endpoint
router.post('/analyze-requirements', async (req, res) => {
  try {
    const { description, projectType = 'mobile-app' } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Description is required and must be a string'
      });
    }

    logger.info('Analyzing requirements', { descriptionLength: description.length, projectType });

    // Analyze requirements
    const analysis = await analyzeRequirements(description, projectType);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error analyzing requirements:', error);
    res.status(500).json({
      error: 'Requirement analysis failed',
      message: error.message
    });
  }
});

// Specification generation endpoint
router.post('/generate-specs', async (req, res) => {
  try {
    const { requirements, format = 'json' } = req.body;
    
    if (!requirements || typeof requirements !== 'object') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Requirements are required and must be an object'
      });
    }

    logger.info('Generating specifications', { format });

    // Generate specifications
    const specs = await generateSpecs(requirements, format);

    res.json({
      success: true,
      data: specs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating specifications:', error);
    res.status(500).json({
      error: 'Specification generation failed',
      message: error.message
    });
  }
});

// Complete pipeline endpoint
router.post('/complete-pipeline', async (req, res) => {
  try {
    const { input, type = 'text', options = {} } = req.body;
    
    if (!input) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Input is required'
      });
    }

    logger.info('Running complete NLP pipeline', { type, inputLength: input.length });

    let text = input;
    
    // If input is speech, convert to text first
    if (type === 'speech') {
      const speechResult = await processSpeech(input, options.language || 'en');
      text = speechResult.text;
    }

    // Process through complete pipeline
    const pipeline = {
      originalInput: input,
      type,
      extractedText: text,
      entities: await extractEntities(text, 'mobile-app'),
      intent: await recognizeIntent(text, options.context || {}),
      requirements: await analyzeRequirements(text, 'mobile-app'),
      specifications: null
    };

    // Generate specifications from requirements
    pipeline.specifications = await generateSpecs(pipeline.requirements, options.format || 'json');

    res.json({
      success: true,
      data: pipeline,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in complete pipeline:', error);
    res.status(500).json({
      error: 'Pipeline processing failed',
      message: error.message
    });
  }
});

// Health check for NLP service
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'nlp-service',
    endpoints: [
      'POST /process-text',
      'POST /speech-to-text',
      'POST /extract-entities',
      'POST /recognize-intent',
      'POST /analyze-requirements',
      'POST /generate-specs',
      'POST /complete-pipeline'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;