'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Star, 
  Send, 
  Bug,
  Lightbulb,
  AlertCircle,
  Heart,
  TrendingUp
} from 'lucide-react';

interface FeedbackFormProps {
  appId: string;
  onSubmit?: (feedback: any) => void;
}

export default function FeedbackForm({ appId, onSubmit }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    type: '',
    category: 'general',
    rating: 0,
    title: '',
    description: '',
    metadata: {}
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-800' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'bg-blue-100 text-blue-800' },
    { value: 'improvement', label: 'Improvement', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
    { value: 'complaint', label: 'Complaint', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
    { value: 'compliment', label: 'Compliment', icon: Heart, color: 'bg-pink-100 text-pink-800' }
  ];

  const categories = [
    'general',
    'ui',
    'performance',
    'security',
    'feature',
    'bug',
    'documentation',
    'support'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          userId: 'anonymous', // In a real app, get from auth
          ...formData,
          rating: formData.rating > 0 ? formData.rating : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          type: '',
          category: 'general',
          rating: 0,
          title: '',
          description: '',
          metadata: {}
        });
        
        if (onSubmit) {
          onSubmit(data.data);
        }
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Network error occurred while submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-colors ${
              star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {formData.rating > 0 ? `${formData.rating} star${formData.rating > 1 ? 's' : ''}` : 'Click to rate'}
        </span>
      </div>
    );
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Thank you for your feedback!</h3>
              <p className="text-muted-foreground">
                Your feedback has been submitted successfully and will be reviewed by our team.
              </p>
            </div>
            <Button onClick={() => setSuccess(false)}>
              Submit Another Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Submit Feedback
        </CardTitle>
        <CardDescription>
          Help us improve by sharing your thoughts, suggestions, or reporting issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Feedback Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {feedbackTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                >
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Rating (Optional)</label>
            {renderStars()}
          </div>

          <div>
            <label htmlFor="title" className="text-sm font-medium mb-2 block">
              Title *
            </label>
            <Input
              id="title"
              placeholder="Brief summary of your feedback"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium mb-2 block">
              Description *
            </label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about your feedback..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[120px]"
              required
            />
          </div>

          <Button type="submit" disabled={loading || !formData.type || !formData.title || !formData.description} className="w-full">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}