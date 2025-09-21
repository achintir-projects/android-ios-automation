'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mic, Send, FileText, Brain, Target, Database, Code } from 'lucide-react';

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

export default function NLPInterface() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    processing?: ProcessingResult;
    intent?: IntentResult;
    entities?: EntityResult;
    requirements?: RequirementResult;
    specs?: any;
  }>({});
  const [error, setError] = useState<string | null>(null);

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

  const runCompletePipeline = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to process');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nlp/complete-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: inputText,
          type: 'text',
          options: {
            format: 'json'
          }
        }),
      });

      const data: NLPResponse = await response.json();

      if (data.success && data.data) {
        const pipeline = data.data;
        setResults({
          processing: {
            originalText: pipeline.extractedText,
            language: pipeline.entities?.[0]?.confidence ? { language: 'en', confidence: 0.8 } : undefined,
            sentiment: { sentiment: 'neutral', confidence: 0.5 },
            keywords: pipeline.entities?.filter((e: any) => e.type === 'keywords').map((e: any) => e.text) || [],
            summary: pipeline.extractedText?.substring(0, 100) + '...',
            classification: { category: 'mobile-app', confidence: 0.7 }
          },
          intent: pipeline.intent,
          entities: {
            domain: 'mobile-app',
            entities: pipeline.entities || [],
            relationships: [],
            confidence: 0.8
          },
          requirements: pipeline.requirements,
          specs: pipeline.specifications
        });
      } else {
        setError(data.error || 'Failed to run complete pipeline');
      }
    } catch (err) {
      setError('Network error occurred while running pipeline');
      console.error('Pipeline error:', err);
    } finally {
      setLoading(false);
    }
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
          NLP Processing Interface
        </h1>
        <p className="text-muted-foreground text-slate-600">
          Convert natural language descriptions into structured app specifications
        </p>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Input Processing
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
          
          <div className="flex gap-2">
            <Button 
              onClick={processText} 
              disabled={loading || !inputText.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Process Text
            </Button>
            
            <Button 
              onClick={runCompletePipeline} 
              disabled={loading || !inputText.trim()}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
            >
              <Target className="h-4 w-4 mr-2" />
              Complete Pipeline
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
                <CardTitle className="text-slate-800">Text Processing Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.processing && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-2 text-slate-700">Original Text</h4>
                      <p className="text-sm bg-slate-50 p-3 rounded border border-slate-200">{results.processing.originalText}</p>
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

                    {results.processing.summary && (
                      <div>
                        <h4 className="font-semibold mb-2 text-slate-700">Summary</h4>
                        <p className="text-sm bg-slate-50 p-3 rounded border border-slate-200">{results.processing.summary}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intent">
            <Card>
              <CardHeader>
                <CardTitle>Intent Recognition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.intent && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-2">Detected Intent</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceColor(results.intent.confidence)}>
                          {results.intent.intent}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Confidence: {(results.intent.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Action</h4>
                      <p className="text-sm bg-muted p-3 rounded font-mono">
                        {results.intent.action}
                      </p>
                    </div>

                    {results.intent.entities && results.intent.entities.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Entities</h4>
                        <div className="space-y-2">
                          {results.intent.entities.map((entity, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{entity.text}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{entity.type}</Badge>
                                <Badge className={getConfidenceColor(entity.confidence)}>
                                  {(entity.confidence * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(results.intent.parameters).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Parameters</h4>
                        <div className="bg-muted p-3 rounded font-mono text-sm">
                          {JSON.stringify(results.intent.parameters, null, 2)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entities">
            <Card>
              <CardHeader>
                <CardTitle>Entity Extraction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.entities && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Domain:</span>
                      <Badge>{results.entities.domain}</Badge>
                      <Badge className={getConfidenceColor(results.entities.confidence)}>
                        {(results.entities.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>

                    {results.entities.entities && results.entities.entities.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Extracted Entities</h4>
                        <div className="space-y-2">
                          {results.entities.entities.map((entity, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <div className="font-medium">{entity.text}</div>
                                <div className="text-sm text-muted-foreground">{entity.category}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{entity.type}</Badge>
                                <Badge className={getConfidenceColor(entity.confidence)}>
                                  {(entity.confidence * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle>Requirements Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.requirements && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Project Type</h4>
                        <Badge>{results.requirements.projectType}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Estimated Complexity</h4>
                        <Badge className={getConfidenceColor(
                          results.requirements.estimatedComplexity === 'high' ? 0.8 :
                          results.requirements.estimatedComplexity === 'medium' ? 0.6 : 0.4
                        )}>
                          {results.requirements.estimatedComplexity}
                        </Badge>
                      </div>
                    </div>

                    {results.requirements.requirements && results.requirements.requirements.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Functional Requirements</h4>
                        <div className="space-y-2">
                          {results.requirements.requirements.map((req, index) => (
                            <div key={index} className="p-3 border rounded">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{req.title}</h5>
                                <Badge className={getPriorityColor(req.priority)}>
                                  {req.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{req.category}</Badge>
                                <Badge variant="outline">{req.id}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.requirements.features && results.requirements.features.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Features</h4>
                        <div className="space-y-2">
                          {results.requirements.features.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <h5 className="font-medium">{feature.name}</h5>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={getConfidenceColor(
                                  feature.complexity === 'high' ? 0.8 :
                                  feature.complexity === 'medium' ? 0.6 : 0.4
                                )}>
                                  {feature.complexity}
                                </Badge>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {feature.estimatedHours}h
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs">
            <Card>
              <CardHeader>
                <CardTitle>Generated Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                {results.specs && (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded">
                      <h4 className="font-semibold mb-2">Technical Specifications (JSON)</h4>
                      <pre className="text-sm overflow-auto max-h-96">
                        {JSON.stringify(results.specs.specifications, null, 2)}
                      </pre>
                    </div>
                    
                    {results.specs.metadata && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Generated: {new Date(results.specs.metadata.generatedAt).toLocaleString()}</span>
                        <span>Format: {results.specs.format}</span>
                        <Badge className={getConfidenceColor(results.specs.metadata.confidence)}>
                          Confidence: {(results.specs.metadata.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}