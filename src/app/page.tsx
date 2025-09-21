'use client';

import React, { useState } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import NLPInterface from '@/components/nlp/NLPInterface';
import FeedbackDashboard from '@/components/feedback/FeedbackDashboard';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AlertsDashboard from '@/components/alerts/AlertsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Rocket,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Star
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('nlp');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nlp':
        return <NLPInterface />;
      case 'feedback':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FeedbackDashboard />
              </div>
              <div>
                <FeedbackForm appId="demo-app" />
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'deployment':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment System
              </CardTitle>
              <CardDescription>
                Multi-channel app deployment automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Google Play Store', status: 'Active', icon: '📱' },
                  { name: 'Apple App Store', status: 'Active', icon: '🍎' },
                  { name: 'TestFlight', status: 'Active', icon: '✈️' },
                  { name: 'Firebase App Distribution', status: 'Active', icon: '🔥' },
                  { name: 'AWS S3', status: 'Active', icon: '📦' },
                  { name: 'GitHub Releases', status: 'Active', icon: '🐙' }
                ].map((channel, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{channel.icon}</span>
                        {channel.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {channel.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      case 'monitoring':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Application Monitoring
              </CardTitle>
              <CardDescription>
                Real-time performance and health monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>CPU Usage</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                          <span className="text-sm">45%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Memory Usage</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                          </div>
                          <span className="text-sm">62%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Disk Usage</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                          <span className="text-sm">78%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'NLP Service', status: 'Healthy', uptime: '99.9%' },
                        { name: 'Code Generation', status: 'Healthy', uptime: '99.8%' },
                        { name: 'Deployment Service', status: 'Healthy', uptime: '99.7%' },
                        { name: 'Monitoring Service', status: 'Healthy', uptime: '100%' }
                      ].map((service, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{service.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {service.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{service.uptime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );
      case 'alerts':
        return <AlertsDashboard />;
      default:
        return <NLPInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <DashboardNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        {renderTabContent()}
      </div>
    </div>
  );
}