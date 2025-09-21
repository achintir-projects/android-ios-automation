'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VoiceRecorder from './VoiceRecorder';
import VoiceCommands from './VoiceCommands';
import { 
  Loader2, 
  Send, 
  FileText, 
  Brain, 
  Target, 
  Database, 
  Code,
  Mic,
  Keyboard,
  Sparkles,
  CheckCircle,
  Command
} from 'lucide-react';

interface NLPResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
}

interface ProcessingResult {
  originalText: string;
  language?: { language: string; confidence: number };
  sentiment?: { sentiment: string; confidence: number };
  keywords?: string[];
  summary?: string;
  classification?: { category: string; confidence: number };
}

interface IntentResult {
  text: string;
  intent: string;
  confidence: number;
  entities: Array<{ type: string; text: string; confidence: number }>;
  action: string;
  parameters: Record<string, any>;
}

interface EntityResult {
  domain: string;
  entities: Array<{
    id: string;
    type: string;
    text: string;
    confidence: number;
    category: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    confidence: number;
  }>;
  confidence: number;
}

interface RequirementResult {
  projectType: string;
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    category: string;
  }>;
  features: Array<{
    id: string;
    name: string;
    description: string;
    complexity: string;
    estimatedHours: number;
  }>;
  estimatedComplexity: string;
  estimatedDuration: string;
  confidence: number;
}

export default function VoiceNLPInterface() {
  const [inputText, setInputText] = useState('');
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('voice');
  const [loading, setLoading] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceCommandsActive, setVoiceCommandsActive] = useState(false);
  const [results, setResults] = useState<{
    processing?: ProcessingResult;
    intent?: IntentResult;
    entities?: EntityResult;
    requirements?: RequirementResult;
    specs?: any;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [voiceSuccess, setVoiceSuccess] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');

  const processText = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to process');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Process text through NLP pipeline
      const processingResponse = await fetch('/api/nlp/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          options: {
            includeSentiment: true,
            includeKeywords: true,
            includeSummary: true,
            includeLanguage: true
          }
        }),
      });

      const processingData: NLPResponse = await processingResponse.json();

      if (processingData.success && processingData.data) {
        setResults(prev => ({ ...prev, processing: processingData.data }));

        // Get intent
        const intentResponse = await fetch('/api/nlp/recognize-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: inputText,
            context: {}
          }),
        });

        const intentData: NLPResponse = await intentResponse.json();
        if (intentData.success && intentData.data) {
          setResults(prev => ({ ...prev, intent: intentData.data }));
        }

        // Extract entities
        const entityResponse = await fetch('/api/nlp/extract-entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: inputText,
            domain: 'mobile-app'
          }),
        });

        const entityData: NLPResponse = await entityResponse.json();
        if (entityData.success && entityData.data) {
          setResults(prev => ({ ...prev, entities: entityData.data }));
        }

        // Analyze requirements
        const requirementResponse = await fetch('/api/nlp/analyze-requirements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: inputText,
            projectType: 'mobile-app'
          }),
        });

        const requirementData: NLPResponse = await requirementResponse.json();
        if (requirementData.success && requirementData.data) {
          setResults(prev => ({ ...prev, requirements: requirementData.data }));

          // Generate specs from requirements
          const specsResponse = await fetch('/api/nlp/generate-specs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requirements: requirementData.data,
              format: 'json'
            }),
          });

          const specsData: NLPResponse = await specsResponse.json();
          if (specsData.success && specsData.data) {
            setResults(prev => ({ ...prev, specs: specsData.data }));
          }
        }
      } else {
        setError(processingData.error || 'Failed to process text');
      }
    } catch (err) {
      setError('Network error occurred while processing text');
      console.error('NLP processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscription = async (transcription: string) => {
    setInputText(transcription);
    setVoiceSuccess(true);
    setVoiceProcessing(false);
    
    // Auto-process the transcribed text
    setTimeout(() => {
      processText();
    }, 500);
  };

  const handleVoiceError = (errorMessage: string) => {
    setError(errorMessage);
    setVoiceProcessing(false);
  };

  const startVoiceProcessing = () => {
    setVoiceProcessing(true);
    setVoiceSuccess(false);
    setError(null);
  };

  const handleVoiceCommand = (command: string, action: string) => {
    setLastCommand(command);
    
    // Handle different voice commands
    if (action === 'process:text') {
      processText();
    } else if (action === 'clear:input') {
      setInputText('');
    } else if (action === 'new:app') {
      setInputText('');
      setResults({});
      setError(null);
    } else if (action === 'show:help') {
      setVoiceCommandsActive(true);
    } else if (action === 'stop:listening') {
      setVoiceCommandsActive(false);
    }
    
    // Clear command after 3 seconds
    setTimeout(() => setLastCommand(''), 3000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-600 to-slate-800 bg-clip-text text-transparent">
          Voice-Powered App Generation
        </h1>
        <p className="text-muted-foreground text-slate-600">
          Speak your ideas and watch them transform into mobile applications
        </p>
      </div>

      {/* Voice Commands Section */}
      <VoiceCommands 
        onCommandDetected={handleVoiceCommand}
        isActive={voiceCommandsActive}
      />

      {/* Input Method Selection */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Choose Your Input Method
          </CardTitle>
          <CardDescription className="text-slate-600">
            Select how you'd like to describe your app idea
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={inputMethod === 'text' ? 'default' : 'outline'}
              onClick={() => setInputMethod('text')}
              className={`flex flex-col items-center gap-2 h-auto p-6 ${
                inputMethod === 'text' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' 
                  : 'border-purple-300 text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Keyboard className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Type Your Idea</div>
                <div className="text-xs opacity-80">Traditional text input</div>
              </div>
            </Button>
            
            <Button
              variant={inputMethod === 'voice' ? 'default' : 'outline'}
              onClick={() => setInputMethod('voice')}
              className={`flex flex-col items-center gap-2 h-auto p-6 ${
                inputMethod === 'voice' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' 
                  : 'border-purple-300 text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Mic className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Speak Your Idea</div>
                <div className="text-xs opacity-80">Voice-powered input</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Recording Interface */}
      {inputMethod === 'voice' && (
        <VoiceRecorder
          onTranscriptionComplete={handleVoiceTranscription}
          onError={handleVoiceError}
          disabled={voiceProcessing || loading}
        />
      )}

      {/* Text Input Interface */}
      {inputMethod === 'text' && (
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Text Input
            </CardTitle>
            <CardDescription className="text-slate-600">
              Enter your app description or requirements in natural language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe your mobile app idea... For example: 'I want to create a fitness tracking app that allows users to log workouts, track progress, and share achievements on social media.'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] bg-white border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
            />
            
            <Button 
              onClick={processText} 
              disabled={loading || !inputText.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Process Text
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Last Command Display */}
      {lastCommand && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Voice command executed: "{lastCommand}"
          </AlertDescription>
        </Alert>
      )}

      {/* Voice Success Message */}
      {voiceSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Voice transcription completed successfully! Your idea is now being processed...
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {Object.keys(results).length > 0 && (
        <Tabs defaultValue="processing" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="processing" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <FileText className="h-4 w-4" />
              Processing
            </TabsTrigger>
            <TabsTrigger value="intent" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Target className="h-4 w-4" />
              Intent
            </TabsTrigger>
            <TabsTrigger value="entities" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Database className="h-4 w-4" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <FileText className="h-4 w-4" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="specs" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Code className="h-4 w-4" />
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="processing">
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Processing Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.processing && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-2 text-slate-700">Original Text</h4>
                      <p className="text-sm bg-slate-50 p-3 rounded border border-slate-200">
                        {results.processing.originalText}
                      </p>
                    </div>

                    {results.processing.language && (
                      <div>
                        <h4 className="font-semibold mb-2 text-slate-700">Language Detection</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getConfidenceColor(results.processing.language.confidence)}>
                            {results.processing.language.language}
                          </Badge>
                          <span className="text-sm text-slate-600">
                            Confidence: {(results.processing.language.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {results.processing.sentiment && (
                      <div>
                        <h4 className="font-semibold mb-2 text-slate-700">Sentiment Analysis</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getConfidenceColor(results.processing.sentiment.confidence)}>
                            {results.processing.sentiment.sentiment}
                          </Badge>
                          <span className="text-sm text-slate-600">
                            Confidence: {(results.processing.sentiment.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {results.processing.keywords && results.processing.keywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-slate-700">Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.processing.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would follow the same pattern as the original NLP interface */}
          <TabsContent value="intent">
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Intent Recognition</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Intent analysis results would be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entities">
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Entity Extraction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Entity extraction results would be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements">
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Requirements Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Requirements analysis results would be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs">
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Generated Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Generated specifications would be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}