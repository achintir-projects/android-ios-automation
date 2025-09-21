'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Users, 
  ThumbsUp, 
  ThumbsDown, 
  Meh,
  Bug,
  Lightbulb,
  AlertCircle,
  Heart,
  BarChart3,
  Calendar,
  Hash
} from 'lucide-react';

interface FeedbackData {
  id: string;
  appId: string;
  userId: string;
  type: string;
  category: string;
  rating?: number;
  title: string;
  description: string;
  sentiment?: string;
  keywords: string[];
  status: string;
  createdAt: string;
  metadata: any;
}

interface AnalyticsData {
  overview: {
    totalFeedback: number;
    avgRating: number;
    responseRate: number;
  };
  sentimentDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  dailyTrends: Array<{
    date: string;
    count: number;
    avgRating: number;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }>;
  topKeywords: Array<{
    keyword: string;
    frequency: number;
  }>;
}

export default function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string>('');

  useEffect(() => {
    loadFeedback();
    loadAnalytics();
  }, [selectedApp]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedApp) params.append('appId', selectedApp);
      
      const response = await fetch(`/api/feedback/list?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedback(data.data.feedback);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedApp) params.append('appId', selectedApp);
      
      const response = await fetch(`/api/feedback/analytics?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load analytics');
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature': return <Lightbulb className="h-4 w-4" />;
      case 'improvement': return <TrendingUp className="h-4 w-4" />;
      case 'complaint': return <AlertCircle className="h-4 w-4" />;
      case 'compliment': return <Heart className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4" />;
      case 'negative': return <ThumbsDown className="h-4 w-4" />;
      case 'neutral': return <Meh className="h-4 w-4" />;
      default: return null;
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and analyze user feedback across all applications
          </p>
        </div>
        <Button onClick={() => { loadFeedback(); loadAnalytics(); }}>
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalFeedback}</div>
              <p className="text-xs text-muted-foreground">
                Across all applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Out of 5 stars
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                Feedback processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sentiment Score</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.sentimentDistribution.positive || 0}P / {analytics.sentimentDistribution.negative || 0}N
              </div>
              <p className="text-xs text-muted-foreground">
                Positive vs Negative
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
                <CardDescription>Breakdown of feedback sentiment</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {Object.entries(analytics.sentimentDistribution).map(([sentiment, count]) => (
                      <div key={sentiment} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(sentiment)}
                          <span className="capitalize">{sentiment}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{count}</Badge>
                          <Progress 
                            value={(count / analytics.overview.totalFeedback) * 100} 
                            className="w-20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Types</CardTitle>
                <CardDescription>Categories of user feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {Object.entries(analytics.typeDistribution).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Keywords</CardTitle>
                <CardDescription>Most frequently mentioned terms</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-2">
                    {analytics.topKeywords.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span>{item.keyword}</span>
                        </div>
                        <Badge variant="outline">{item.frequency}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Feedback by category</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {Object.entries(analytics.categoryDistribution).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest user submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading feedback...</div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="font-medium">{item.title}</span>
                          <Badge variant="outline" className={getSentimentColor(item.sentiment || '')}>
                            {item.sentiment}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(item.rating)}
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          {item.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Trends</CardTitle>
              <CardDescription>Feedback trends over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && (
                <div className="space-y-4">
                  {analytics.dailyTrends.map((trend, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{trend.date}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="font-medium">{trend.count}</span> feedback
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{trend.avgRating.toFixed(1)}</span> avg rating
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-green-500" />
                          <span>{trend.sentiment.positive}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Meh className="h-3 w-3 text-yellow-500" />
                          <span>{trend.sentiment.neutral}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="h-3 w-3 text-red-500" />
                          <span>{trend.sentiment.negative}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}