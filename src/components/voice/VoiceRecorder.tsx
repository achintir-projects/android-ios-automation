'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Volume2, 
  VolumeX,
  Waves,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

interface AudioLevel {
  level: number;
  timestamp: number;
}

export default function VoiceRecorder({ onTranscriptionComplete, onError, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevels, setAudioLevels] = useState<AudioLevel[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const microphoneRef = useRef<MediaStreamAudioSourceNode>();

  // Initialize audio context and check permissions
  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      stopRecording();
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionGranted(permissions.state === 'granted');
      
      if (permissions.state === 'prompt') {
        // We'll request permission when user clicks record
      }
    } catch (err) {
      // Fallback for browsers that don't support permissions API
      setPermissionGranted(null);
    }
  };

  const startRecording = async () => {
    if (disabled) return;
    
    try {
      setError(null);
      audioChunksRef.current = [];
      setAudioLevels([]);
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Start audio level monitoring
      const updateAudioLevels = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        
        setAudioLevels(prev => {
          const newLevels = [...prev, { level: normalizedLevel, timestamp: Date.now() }];
          // Keep only last 50 levels for visualization
          return newLevels.slice(-50);
        });

        animationRef.current = requestAnimationFrame(updateAudioLevels);
      };

      updateAudioLevels();

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleRecordingStop;
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      
      setIsRecording(true);
      setPermissionGranted(true);

      // Update recording time
      const updateTime = () => {
        if (startTimeRef.current) {
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
        if (isRecording) {
          setTimeout(updateTime, 100);
        }
      };
      updateTime();

    } catch (err) {
      console.error('Error starting recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      setPermissionGranted(false);
      onError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async () => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size < 1024) { // Less than 1KB
        throw new Error('Recording too short. Please speak for at least 1 second.');
      }

      // Convert to base64 for API transmission
      const base64Audio = await blobToBase64(audioBlob);
      
      // Send to speech-to-text API
      const transcription = await sendToSpeechToTextAPI(base64Audio);
      
      if (transcription.trim()) {
        onTranscriptionComplete(transcription);
      } else {
        throw new Error('No speech detected in the recording');
      }
      
    } catch (err) {
      console.error('Error processing recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process audio';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendToSpeechToTextAPI = async (audioBase64: string): Promise<string> => {
    try {
      const response = await fetch('/api/voice/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioBase64,
          format: 'webm',
          language: 'en-US'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      return data.transcription || '';
    } catch (err) {
      console.error('Speech-to-text API error:', err);
      throw new Error('Speech recognition service unavailable');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAverageAudioLevel = (): number => {
    if (audioLevels.length === 0) return 0;
    const sum = audioLevels.reduce((acc, level) => acc + level.level, 0);
    return sum / audioLevels.length;
  };

  const renderAudioVisualization = () => {
    if (audioLevels.length === 0) return null;

    const maxLevel = Math.max(...audioLevels.map(l => l.level), 1);
    
    return (
      <div className="flex items-end justify-center h-16 gap-1 mt-2">
        {audioLevels.map((level, index) => {
          const height = (level.level / maxLevel) * 100;
          const opacity = 0.3 + (level.level / maxLevel) * 0.7;
          return (
            <div
              key={index}
              className="w-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-100"
              style={{
                height: `${height}%`,
                opacity: opacity
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-purple-600" />
          Voice Recording
        </CardTitle>
        <CardDescription className="text-slate-600">
          Click the microphone and speak naturally to describe your app idea
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isProcessing}
            size="lg"
            className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl animate-pulse' 
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg'
            }`}
          >
            {isRecording ? (
              <MicOff className="h-8 w-8 text-white" />
            ) : isProcessing ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </Button>

          {isRecording && (
            <div className="text-center space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-red-200 text-red-700">
                  Recording
                </Badge>
                <span className="text-sm font-mono text-slate-600">
                  {formatTime(recordingTime)}
                </span>
              </div>
              {renderAudioVisualization()}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Waves className="h-4 w-4" />
                <span>Audio Level: {getAverageAudioLevel().toFixed(0)}%</span>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="text-center space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-slate-600">Processing your speech...</span>
              </div>
            </div>
          )}

          {!isRecording && !isProcessing && permissionGranted === false && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Microphone access denied. Please enable microphone permissions to use voice recording.
              </AlertDescription>
            </Alert>
          )}

          {!isRecording && !isProcessing && permissionGranted === null && (
            <p className="text-xs text-slate-500 text-center max-w-xs">
              Click the microphone button to start recording. You'll be prompted to allow microphone access.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="text-2xl mb-1">🎤</div>
            <p className="text-xs text-slate-600">High Quality</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs text-slate-600">Real-time</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs text-slate-600">Secure</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}