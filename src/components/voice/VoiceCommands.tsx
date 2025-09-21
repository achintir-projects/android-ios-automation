'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Command, 
  Volume2, 
  Mic, 
  CheckCircle, 
  AlertCircle,
  Zap,
  ArrowRight,
  Clock
} from 'lucide-react';

interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  description: string;
  category: 'navigation' | 'action' | 'system';
  icon: string;
}

interface VoiceCommandsProps {
  onCommandDetected: (command: string, action: string) => void;
  isActive?: boolean;
}

export default function VoiceCommands({ onCommandDetected, isActive = false }: VoiceCommandsProps) {
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');

  const commands: VoiceCommand[] = [
    {
      id: 'nav-home',
      phrase: 'go home',
      action: 'navigate:/',
      description: 'Navigate to home page',
      category: 'navigation',
      icon: '🏠'
    },
    {
      id: 'nav-nlp',
      phrase: 'nlp processing',
      action: 'navigate:nlp',
      description: 'Go to NLP processing',
      category: 'navigation',
      icon: '🧠'
    },
    {
      id: 'nav-voice',
      phrase: 'voice interface',
      action: 'navigate:voice',
      description: 'Open voice interface',
      category: 'navigation',
      icon: '🎤'
    },
    {
      id: 'nav-analytics',
      phrase: 'show analytics',
      action: 'navigate:analytics',
      description: 'View analytics dashboard',
      category: 'navigation',
      icon: '📊'
    },
    {
      id: 'action-process',
      phrase: 'process text',
      action: 'process:text',
      description: 'Process current text input',
      category: 'action',
      icon: '⚡'
    },
    {
      id: 'action-clear',
      phrase: 'clear input',
      action: 'clear:input',
      description: 'Clear text input field',
      category: 'action',
      icon: '🗑️'
    },
    {
      id: 'action-new',
      phrase: 'new app',
      action: 'new:app',
      description: 'Start new app generation',
      category: 'action',
      icon: '🆕'
    },
    {
      id: 'system-help',
      phrase: 'help commands',
      action: 'show:help',
      description: 'Show available commands',
      category: 'system',
      icon: '❓'
    },
    {
      id: 'system-stop',
      phrase: 'stop listening',
      action: 'stop:listening',
      description: 'Stop voice recognition',
      category: 'system',
      icon: '⏹️'
    }
  ];

  // Simple voice command detection (simulated)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (isListening && Math.random() > 0.7) { // Simulate command detection
        const randomCommand = commands[Math.floor(Math.random() * commands.length)];
        detectCommand(randomCommand.phrase);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, isListening]);

  const detectCommand = (text: string) => {
    setRecognizedText(text);
    
    // Find matching command
    const matchedCommand = commands.find(cmd => 
      text.toLowerCase().includes(cmd.phrase.toLowerCase())
    );

    if (matchedCommand) {
      setLastCommand(matchedCommand.id);
      onCommandDetected(matchedCommand.phrase, matchedCommand.action);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setLastCommand(null);
        setRecognizedText('');
      }, 3000);
    }
  };

  const startListening = () => {
    setIsListening(true);
    setRecognizedText('Listening for commands...');
  };

  const stopListening = () => {
    setIsListening(false);
    setRecognizedText('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation': return 'bg-blue-100 text-blue-800';
      case 'action': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const commandsByCategory = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Command className="h-5 w-5 text-purple-600" />
          Voice Commands
        </CardTitle>
        <CardDescription className="text-slate-600">
          Control the app with your voice using simple commands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Command Status */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleListening}
              size="sm"
              className={`relative ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium">
                  {isListening ? 'Listening...' : 'Voice Commands Ready'}
                </span>
              </div>
              {recognizedText && (
                <p className="text-xs text-slate-600 mt-1">
                  "{recognizedText}"
                </p>
              )}
            </div>
          </div>
          
          {lastCommand && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Command detected!</span>
            </div>
          )}
        </div>

        {/* Command Categories */}
        <div className="space-y-4">
          {Object.entries(commandsByCategory).map(([category, categoryCommands]) => (
            <div key={category}>
              <h4 className="font-semibold text-slate-700 mb-2 capitalize">
                {category} Commands
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {categoryCommands.map((command) => (
                  <div
                    key={command.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                      lastCommand === command.id
                        ? 'border-green-300 bg-green-50'
                        : 'border-slate-200 bg-white'
                    }`}
                    onClick={() => detectCommand(command.phrase)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{command.icon}</span>
                        <div>
                          <div className="font-medium text-sm text-slate-800">
                            {command.phrase}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {command.description}
                          </div>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(command.category)}>
                        {command.category}
                      </Badge>
                    </div>
                    
                    {lastCommand === command.id && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Executed</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Tips:</strong> Speak clearly and naturally. Commands work best when you say the exact phrase. 
            Use "stop listening" to turn off voice commands when not needed.
          </AlertDescription>
        </Alert>

        {/* Recent Activity */}
        <div className="border-t border-slate-200 pt-4">
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            How it works
          </h4>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Click "Start" to begin voice command listening</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Speak one of the command phrases clearly</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Watch as your commands are executed instantly</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}