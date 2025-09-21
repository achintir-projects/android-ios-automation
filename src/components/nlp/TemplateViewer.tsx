'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Download, 
  Copy, 
  Eye,
  FileText,
  Code,
  Target,
  Database,
  Brain,
  ArrowLeft,
  Save,
  FolderOpen
} from 'lucide-react';

interface TemplateData {
  id: string;
  name: string;
  description: string;
  originalInput: string;
  domain: string;
  requirements: any;
  specifications: any;
  metadata: any;
  tags: string[];
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateViewerProps {
  template: TemplateData;
  onClose: () => void;
  onUseTemplate?: (template: TemplateData) => void;
  onSaveAsApp?: (template: TemplateData) => void;
}

export default function TemplateViewer({ 
  template, 
  onClose, 
  onUseTemplate,
  onSaveAsApp 
}: TemplateViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen, onClose]);

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

  const handleExportTemplate = () => {
    const exportData = {
      name: template.name,
      description: template.description,
      originalInput: template.originalInput,
      domain: template.domain,
      requirements: template.requirements,
      specifications: template.specifications,
      metadata: template.metadata,
      tags: template.tags,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(template.originalInput).catch(() => {
        // Fallback for clipboard API not being available
        const textArea = document.createElement('textarea');
        textArea.value = template.originalInput;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
        }
        document.body.removeChild(textArea);
      });
    } else {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = template.originalInput;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
      document.body.removeChild(textArea);
    }
    // You could add a toast notification here
  };

  const viewerClasses = isFullscreen 
    ? 'fixed inset-0 z-50 bg-background overflow-auto'
    : 'fixed inset-4 z-50 bg-background border rounded-lg shadow-2xl overflow-auto';

  const contentClasses = isFullscreen 
    ? 'max-w-7xl mx-auto p-6 space-y-6'
    : 'p-6 space-y-6';

  return (
    <div className={viewerClasses}>
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {isFullscreen ? 'Exit Fullscreen' : 'Close'}
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold">{template.name}</h1>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-2"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Input
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            {onUseTemplate && (
              <Button
                size="sm"
                onClick={() => onUseTemplate(template)}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                Use Template
              </Button>
            )}
            
            {onSaveAsApp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSaveAsApp(template)}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save as App
              </Button>
            )}
          </div>
        </div>
        
        {/* Metadata */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{template.domain}</Badge>
            {template.isTemplate && (
              <Badge variant="secondary">Template</Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="text-muted-foreground">
            Created: {new Date(template.createdAt).toLocaleDateString()}
          </div>
          
          {template.metadata?.confidence && (
            <Badge className={getConfidenceColor(template.metadata.confidence)}>
              Confidence: {(template.metadata.confidence * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={contentClasses}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="specs" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              Specifications
            </TabsTrigger>
            <TabsTrigger value="flow" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              User Flow
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="original" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Original Input
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Name</h4>
                    <p>{template.specifications?.projectInfo?.name || template.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Type</h4>
                    <p>{template.specifications?.projectInfo?.type || 'Mobile App'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Domain</h4>
                    <p>{template.domain}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Version</h4>
                    <p>{template.specifications?.projectInfo?.version || '1.0.0'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requirements Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Project Type</h4>
                    <p>{template.requirements?.projectType || 'Mobile App'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Complexity</h4>
                    <Badge className={getConfidenceColor(
                      template.requirements?.complexity === 'high' ? 0.8 :
                      template.requirements?.complexity === 'medium' ? 0.6 : 0.4
                    )}>
                      {template.requirements?.complexity || 'medium'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Requirements</h4>
                    <p>{template.requirements?.requirements?.length || 0} items</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Features</h4>
                    <p>{template.requirements?.features?.length || 0} items</p>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Platforms</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.specifications?.technicalSpecs?.platforms?.map((platform: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      )) || (
                        <Badge variant="outline" className="text-xs">iOS, Android</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Languages</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.specifications?.technicalSpecs?.languages?.map((lang: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      )) || (
                        <Badge variant="secondary" className="text-xs">JavaScript, TypeScript</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Frameworks</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.specifications?.technicalSpecs?.frameworks?.map((framework: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {framework}
                        </Badge>
                      )) || (
                        <Badge variant="outline" className="text-xs">React Native</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {template.specifications?.projectInfo?.description || template.description}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            {template.requirements?.requirements && template.requirements.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Functional Requirements</CardTitle>
                  <CardDescription>Detailed requirements for the application</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {template.requirements.requirements.map((req: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{req.title}</h4>
                          <Badge className={getPriorityColor(req.priority)}>
                            {req.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{req.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{req.category}</Badge>
                          <Badge variant="outline" className="text-xs">{req.id}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {template.requirements?.features && template.requirements.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                  <CardDescription>Application features with complexity estimates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {template.requirements.features.map((feature: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{feature.name}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                        <div className="text-right ml-4">
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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="specs" className="space-y-6">
            {/* User Flow */}
            {template.specifications?.uiSpecs?.userFlow && (
              <Card>
                <CardHeader>
                  <CardTitle>User Flow</CardTitle>
                  <CardDescription>Step-by-step user journey through the application</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {template.specifications.uiSpecs.userFlow.map((flow: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {flow.step}
                          </div>
                          <div>
                            <h4 className="font-medium">{flow.name}</h4>
                            <p className="text-sm text-muted-foreground">{flow.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-muted-foreground">Screens</h5>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {flow.screens.map((screen: string, screenIndex: number) => (
                                <Badge key={screenIndex} variant="outline" className="text-xs">
                                  {screen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-muted-foreground">Actions</h5>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {flow.actions.map((action: string, actionIndex: number) => (
                                <Badge key={actionIndex} variant="secondary" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* App Flow */}
            {template.specifications?.uiSpecs?.appFlow && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Flow</CardTitle>
                  <CardDescription>Technical architecture and data flow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Entry Points</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.specifications.uiSpecs.appFlow.entryPoints.map((point: string, index: number) => (
                        <Badge key={index} variant="outline">{point}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Core Modules</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.specifications.uiSpecs.appFlow.coreModules.map((module: string, index: number) => (
                        <Badge key={index} variant="secondary">{module}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Data Flow</h4>
                    <div className="space-y-1">
                      {template.specifications.uiSpecs.appFlow.dataFlow.map((flow: string, index: number) => (
                        <div key={index} className="text-sm bg-muted p-2 rounded font-mono">
                          {flow}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Integration Points</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.specifications.uiSpecs.appFlow.integrationPoints.map((point: string, index: number) => (
                        <Badge key={index} variant="outline">{point}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Structure */}
            {template.specifications?.uiSpecs?.navigation && (
              <Card>
                <CardHeader>
                  <CardTitle>Navigation Structure</CardTitle>
                  <CardDescription>App navigation and menu structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Main Menu</h4>
                    <div className="space-y-2">
                      {template.specifications.uiSpecs.navigation.mainMenu.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                          {item.submenu && (
                            <Badge variant="outline" className="text-xs">
                              {item.submenu.length} items
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Bottom Navigation</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.specifications.uiSpecs.navigation.bottomNav.map((item: string, index: number) => (
                        <Badge key={index} variant="secondary">{item}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="flow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Complete User Journey</CardTitle>
                <CardDescription>End-to-end user experience flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {template.specifications?.uiSpecs?.userFlow?.map((flow: any, index: number) => (
                    <div key={index} className="relative">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                            {flow.step}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium">{flow.name}</h3>
                          <p className="text-muted-foreground mb-3">{flow.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-muted p-3 rounded">
                              <h4 className="font-medium text-sm mb-2">Screens Involved</h4>
                              <div className="space-y-1">
                                {flow.screens.map((screen: string, screenIndex: number) => (
                                  <div key={screenIndex} className="text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    {screen}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="bg-muted p-3 rounded">
                              <h4 className="font-medium text-sm mb-2">User Actions</h4>
                              <div className="space-y-1">
                                {flow.actions.map((action: string, actionIndex: number) => (
                                  <div key={actionIndex} className="text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                    {action}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < (template.specifications.uiSpecs.userFlow.length - 1) && (
                        <div className="flex justify-center py-4">
                          <div className="w-0.5 h-8 bg-border"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tech" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="tech">Technical</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                    <TabsTrigger value="data">Data Model</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tech" className="space-y-4">
                    {template.specifications?.technicalSpecs && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Platforms</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.specifications.technicalSpecs.platforms.map((platform: string, index: number) => (
                              <Badge key={index} variant="outline">{platform}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Languages</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.specifications.technicalSpecs.languages.map((lang: string, index: number) => (
                              <Badge key={index} variant="secondary">{lang}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Frameworks</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.specifications.technicalSpecs.frameworks.map((framework: string, index: number) => (
                              <Badge key={index} variant="outline">{framework}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Databases</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.specifications.technicalSpecs.databases.map((db: string, index: number) => (
                              <Badge key={index} variant="secondary">{db}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="api" className="space-y-4">
                    {template.specifications?.apiSpecs && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Authentication</h4>
                          <p className="text-sm text-muted-foreground">{template.specifications.apiSpecs.authentication}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Authorization</h4>
                          <p className="text-sm text-muted-foreground">{template.specifications.apiSpecs.authorization}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Rate Limiting</h4>
                          <p className="text-sm text-muted-foreground">{template.specifications.apiSpecs.rateLimiting}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="data" className="space-y-4">
                    {template.specifications?.dataModel && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Storage</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.specifications.dataModel.storage.map((storage: string, index: number) => (
                              <Badge key={index} variant="outline">{storage}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Backup Strategy</h4>
                          <p className="text-sm text-muted-foreground">{template.specifications.dataModel.backup}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="security" className="space-y-4">
                    {template.specifications?.security && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Encryption</h4>
                          <p className="text-sm text-muted-foreground">{template.specifications.security.encryption}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Compliance</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.specifications.security.compliance.map((item: string, index: number) => (
                              <Badge key={index} variant="outline">{item}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="original" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Original Input</CardTitle>
                <CardDescription>The natural language description that generated this template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {template.originalInput}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Additional information about this template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Generated At</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.metadata?.generatedAt ? 
                        new Date(template.metadata.generatedAt).toLocaleString() : 
                        new Date(template.createdAt).toLocaleString()
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Pipeline Version</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.metadata?.pipelineVersion || '1.0'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Detected Intent</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.metadata?.intent || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Detected Domain</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.metadata?.detectedDomain || template.domain}
                    </p>
                  </div>
                </div>
                
                {template.metadata && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Raw Metadata</h4>
                    <div className="bg-muted p-3 rounded text-sm font-mono max-h-40 overflow-y-auto">
                      <pre>{JSON.stringify(template.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}