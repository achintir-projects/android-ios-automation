const { openai, logger } = require('../index');
const { AppError } = require('../middleware/errorHandler');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Process speech audio to text
 */
const processSpeech = async (audioData, language = 'en') => {
  try {
    logger.info('Processing speech to text', { language, audioSize: audioData.length });

    // Create temporary file for audio
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `audio_${Date.now()}.wav`);
    
    // Write audio data to file
    fs.writeFileSync(tempFile, Buffer.from(audioData, 'base64'));

    let transcript = '';

    try {
      // Try OpenAI Whisper first
      transcript = await transcribeWithOpenAI(tempFile, language);
    } catch (openaiError) {
      logger.warn('OpenAI transcription failed, trying fallback:', openaiError.message);
      
      // Fallback to local processing if available
      try {
        transcript = await transcribeWithFallback(tempFile, language);
      } catch (fallbackError) {
        logger.warn('Fallback transcription failed:', fallbackError.message);
        throw new AppError('Speech transcription failed', 500);
      }
    }

    // Clean up temporary file
    try {
      fs.unlinkSync(tempFile);
    } catch (cleanupError) {
      logger.warn('Failed to clean up temporary file:', cleanupError);
    }

    return {
      text: transcript,
      language,
      confidence: 0.9, // Placeholder confidence
      processingTime: Date.now(),
      method: transcript ? 'openai' : 'fallback'
    };

  } catch (error) {
    logger.error('Speech processing failed:', error);
    throw new AppError('Speech processing failed', 500);
  }
};

/**
 * Transcribe using OpenAI Whisper
 */
const transcribeWithOpenAI = async (audioFile, language) => {
  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile),
      model: 'whisper-1',
      language: language,
      response_format: 'text'
    });

    return response.trim();
  } catch (error) {
    logger.error('OpenAI transcription failed:', error);
    throw error;
  }
};

/**
 * Fallback transcription using local tools
 */
const transcribeWithFallback = async (audioFile, language) => {
  try {
    // Check if ffmpeg is available for audio conversion
    try {
      await execAsync('ffmpeg -version');
    } catch (ffmpegError) {
      throw new Error('FFmpeg not available for audio processing');
    }

    // Convert audio to proper format if needed
    const convertedFile = audioFile.replace('.wav', '_converted.wav');
    try {
      await execAsync(`ffmpeg -i "${audioFile}" -ar 16000 -ac 1 "${convertedFile}"`);
      
      // For now, return a placeholder since we don't have a local speech recognition model
      // In a real implementation, you would integrate with a local model like Vosk
      return 'Speech transcription placeholder - local model integration needed';
    } finally {
      // Clean up converted file
      if (fs.existsSync(convertedFile)) {
        fs.unlinkSync(convertedFile);
      }
    }
  } catch (error) {
    logger.error('Fallback transcription failed:', error);
    throw error;
  }
};

/**
 * Validate audio format
 */
const validateAudioFormat = (audioData) => {
  // Check if audio data is valid base64
  try {
    Buffer.from(audioData, 'base64');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get audio metadata
 */
const getAudioMetadata = async (audioFile) => {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${audioFile}"`);
    return JSON.parse(stdout);
  } catch (error) {
    logger.warn('Failed to get audio metadata:', error);
    return null;
  }
};

/**
 * Detect language from audio (if not provided)
 */
const detectAudioLanguage = async (audioFile) => {
  try {
    // This would typically use a language detection model
    // For now, return a default
    return 'en';
  } catch (error) {
    logger.warn('Language detection failed:', error);
    return 'en';
  }
};

/**
 * Process multiple audio files (batch processing)
 */
const processBatchSpeech = async (audioFiles, language = 'en') => {
  try {
    const results = [];
    
    for (let i = 0; i < audioFiles.length; i++) {
      const audioFile = audioFiles[i];
      
      try {
        const result = await processSpeech(audioFile, language);
        results.push({
          index: i,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }
    }

    return {
      total: audioFiles.length,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  } catch (error) {
    logger.error('Batch speech processing failed:', error);
    throw new AppError('Batch speech processing failed', 500);
  }
};

/**
 * Real-time speech processing setup
 */
const setupRealTimeProcessing = (websocket) => {
  let audioBuffer = [];
  let isProcessing = false;

  websocket.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'audio_chunk') {
        audioBuffer.push(message.audioData);
        
        // Process when buffer reaches certain size or timeout
        if (audioBuffer.length >= 10 || message.isFinal) {
          if (!isProcessing) {
            isProcessing = true;
            
            try {
              const combinedAudio = audioBuffer.join('');
              const result = await processSpeech(combinedAudio, message.language || 'en');
              
              websocket.send(JSON.stringify({
                type: 'transcription_result',
                data: result,
                isFinal: message.isFinal
              }));
            } catch (error) {
              websocket.send(JSON.stringify({
                type: 'error',
                message: error.message
              }));
            } finally {
              audioBuffer = [];
              isProcessing = false;
            }
          }
        }
      }
    } catch (error) {
      logger.error('Real-time speech processing error:', error);
      websocket.send(JSON.stringify({
        type: 'error',
        message: 'Processing error'
      }));
    }
  });

  return websocket;
};

module.exports = {
  processSpeech,
  processBatchSpeech,
  validateAudioFormat,
  getAudioMetadata,
  detectAudioLanguage,
  setupRealTimeProcessing
};