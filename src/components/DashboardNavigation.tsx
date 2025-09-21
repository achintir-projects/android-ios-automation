'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Rocket,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Star,
  Mic
} from 'lucide-react';

interface DashboardNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardNavigation({ activeTab, onTabChange }: DashboardNavigationProps) {
  const features = [
    {
      id: 'nlp',
      title: 'App Idea Translator',
      description: 'Describe your idea in plain English, get a complete app!',
      icon: Lightbulb,
      status: 'new',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    },
    {
      id: 'voice',
      title: 'Voice Interface',
      description: 'Speak your ideas and generate apps instantly',
      icon: Mic,
      status: 'new',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    },
    {
      id: 'feedback',
      title: 'Feedback System',
      description: 'Collect and analyze user feedback',
      icon: MessageSquare,
      status: 'active',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Comprehensive data visualization and reporting',
      icon: BarChart3,
      status: 'beta',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'deployment',
      title: 'Deployment System',
      description: 'Multi-channel app deployment automation',
      icon: Rocket,
      status: 'active',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'monitoring',
      title: 'Application Monitoring',
      description: 'Real-time performance and health monitoring',
      icon: Shield,
      status: 'active',
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 'alerts',
      title: 'Alert System',
      description: 'Intelligent notifications and alerts',
      icon: Zap,
      status: 'coming-soon',
      color: 'bg-yellow-100 text-yellow-800'
    }
  ];

  const stats = [
    {
      label: 'Apps Generated',
      value: '1,247',
      change: '+12%',
      icon: Rocket,
      color: 'text-blue-600'
    },
    {
      label: 'Active Users',
      value: '8,529',
      change: '+23%',
      icon: Users,
      color: 'text-green-600'
    },
    {
      label: 'Feedback Processed',
      value: '3,847',
      change: '+8%',
      icon: MessageSquare,
      color: 'text-purple-600'
    },
    {
      label: 'System Uptime',
      value: '99.9%',
      change: '+0.1%',
      icon: Shield,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-purple-600 to-slate-800 bg-clip-text text-transparent">
          Mobile App Automation Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transform your ideas into fully functional mobile applications with our friendly AI-powered app creator
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-600 font-semibold">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Platform Features
          </CardTitle>
          <CardDescription className="text-slate-600">
            Explore our comprehensive suite of mobile app automation tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 bg-slate-100 p-1 rounded-lg">
              {features.map((feature) => (
                <TabsTrigger 
                  key={feature.id} 
                  value={feature.id} 
                  className="flex flex-col gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  <feature.icon className="h-5 w-5" />
                  <span className="text-xs">{feature.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <Card 
                  key={feature.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg bg-white border-slate-200 ${
                    activeTab === feature.id 
                      ? 'ring-2 ring-purple-500/20 shadow-lg bg-gradient-to-br from-white to-purple-50/30' 
                      : 'hover:border-purple-300'
                  }`}
                  onClick={() => onTabChange(feature.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <feature.icon className={`h-6 w-6 ${
                        activeTab === feature.id ? 'text-purple-600' : 'text-slate-600'
                      }`} />
                      <Badge className={`${feature.color} border-0 shadow-sm ${
                        feature.status === 'new' ? 'animate-pulse' : ''
                      }`}>
                        {feature.status === 'active' ? 'Active' : 
                         feature.status === 'beta' ? 'Beta' : 
                         feature.status === 'new' ? 'NEW' : 'Coming Soon'}
                      </Badge>
                    </div>
                    <CardTitle className={`text-lg ${
                      activeTab === feature.id ? 'text-slate-800' : 'text-slate-700'
                    }`}>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}