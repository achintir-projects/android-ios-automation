'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Sparkles, Lightbulb, Rocket, Clock, Target } from 'lucide-react';

interface AppIdeaResponse {
  success: boolean;
  message: string;
  appIdea: {
    description: string;
    appType: { name: string; confidence: number };
    features: Array<{ name: string; description: string; icon: string }>;
    platform: string;
    complexity: 'Simple' | 'Medium' | 'Complex';
    estimatedTime: string;
    nextSteps: string[];
  };
  suggestions: string[];
  timestamp?: string;
}

interface GeneratedApp {
  success: boolean;
  message: string;
  app: {
    name: string;
    description: string;
    type: string;
    platform: string;
    features: Array<{ name: string; description: string; icon: string }>;
    files: Array<{ name: string; content: string; type: string }>;
    setup: string;
    nextSteps: string[];
  };
  tips: string[];
}

export default function AppIdeaTranslator() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AppIdeaResponse | null>(null);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeIdea = async () => {
    if (!idea.trim()) {
      setError('Tell me about your app idea!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/app-idea/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: idea,
        }),
      });

      const data: AppIdeaResponse = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'I had trouble understanding your idea');
      }
    } catch (err) {
      setError('Something went wrong. Let me try again!');
      console.error('App idea analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateApp = async () => {
    if (!results) {
      setError('Please analyze your idea first!');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/app-idea/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appIdea: results.appIdea,
        }),
      });

      const data: GeneratedApp = await response.json();

      if (data.success) {
        setGeneratedApp(data);
      } else {
        setError(data.error || 'I had trouble creating your app');
      }
    } catch (err) {
      setError('Something went wrong while creating your app. Let me try a different approach!');
      console.error('App generation error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExampleIdeas = () => [
    "I want to create a fitness app that tracks workouts and shows progress charts",
    "Build a social app where friends can share photos and chat",
    "Make a shopping app with a cart and payment system",
    "Create a todo app that reminds me of important tasks",
    "Build a game where players can compete for high scores"
  ];

  const applyExampleIdea = (example: string) => {
    setIdea(example);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          🚀 App Idea Translator
        </h1>
        <p className="text-lg text-muted-foreground text-slate-600 max-w-2xl mx-auto">
          Describe your app idea in simple words, and I'll help you understand what it needs and create a basic version for you!
        </p>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Lightbulb className="h-6 w-6" />
            What's Your App Idea?
          </CardTitle>
          <CardDescription className="text-slate-600">
            Tell me about your app in plain English. What should it do? Who is it for?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="I want to create an app that..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="min-h-[120px] bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 text-slate-700 placeholder:text-slate-400"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Need inspiration? Try these:</p>
            <div className="flex flex-wrap gap-2">
              {getExampleIdeas().map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applyExampleIdea(example)}
                  className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {example.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={analyzeIdea} 
              disabled={loading || !idea.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Understanding...' : 'Understand My Idea'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Target className="h-6 w-6" />
              I Understand Your Idea!
            </CardTitle>
            <CardDescription className="text-slate-600">
              Here's what I found and how we can build it:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">📱 App Type</h4>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800">
                    {results.appIdea.appType.name}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    ({Math.round(results.appIdea.appType.confidence * 100)}% match)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">⏱️ Time Needed</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-slate-700">{results.appIdea.estimatedTime}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">📊 Complexity</h4>
                <Badge className={getComplexityColor(results.appIdea.complexity)}>
                  {results.appIdea.complexity}
                </Badge>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">📱 Platform</h4>
                <Badge className="bg-blue-100 text-blue-800">
                  {results.appIdea.platform}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-purple-700">✨ Key Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.appIdea.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-purple-100">
                    <span className="text-xl">{feature.icon}</span>
                    <div>
                      <h5 className="font-medium text-slate-800">{feature.name}</h5>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-purple-700">🚀 Next Steps</h4>
              <div className="space-y-2">
                {results.appIdea.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-700">
                    <span className="text-purple-600">•</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {results.suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">💡 Pro Tips</h4>
                <div className="space-y-2">
                  {results.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={generateApp} 
                disabled={analyzing}
                className="flex-1 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 shadow-lg"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                {analyzing ? 'Creating Your App...' : 'Create My App!'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedApp && (
        <Card className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Rocket className="h-6 w-6" />
              Your App is Ready! 🎉
            </CardTitle>
            <CardDescription className="text-slate-600">
              I've created a basic version of {generatedApp.app.name} for you!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-green-700">{generatedApp.app.name}</h3>
              <p className="text-slate-600">{generatedApp.app.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700">📁 Files Created</h4>
                <div className="space-y-1">
                  {generatedApp.app.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-green-600">📄</span>
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-green-700">🚀 Quick Start</h4>
                <div className="space-y-2">
                  {generatedApp.app.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-slate-700">
                      <span className="text-green-600">•</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">💡 Developer Tips</h4>
              <div className="grid md:grid-cols-1 gap-2">
                {generatedApp.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 bg-white p-3 rounded-lg border border-green-100">
                    <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-700 mb-2">📋 Setup Instructions</h4>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded">
                {generatedApp.app.setup}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}