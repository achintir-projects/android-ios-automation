'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Trash2, Eye, Copy, Download } from 'lucide-react';
import TemplateViewer from './TemplateViewer';

interface SavedApp {
  id: string;
  name: string;
  description: string;
  originalInput: string;
  domain: string;
  requirements: string;
  specifications: string;
  metadata: string;
  isTemplate: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export default function SavedAppsManager() {
  const [savedApps, setSavedApps] = useState<SavedApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<SavedApp | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateViewerOpen, setTemplateViewerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('apps');

  useEffect(() => {
    loadSavedApps();
  }, []);

  const loadSavedApps = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/saved-apps');
      const result = await response.json();
      
      if (result.success) {
        setSavedApps(result.data);
      }
    } catch (error) {
      console.error('Error loading saved apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    try {
      const response = await fetch(`/api/saved-apps/${appId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSavedApps(prev => prev.filter(app => app.id !== appId));
        setDeleteDialogOpen(false);
        setSelectedApp(null);
      } else {
        alert(result.error || 'Failed to delete app');
      }
    } catch (error) {
      console.error('Error deleting app:', error);
      alert('Failed to delete app');
    }
  };

  const handleUseApp = (app: any) => {
    // This would typically populate the NLP interface with the app data
    // For now, we'll just copy the original input to clipboard
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(app.originalInput).catch(() => {
        // Fallback for clipboard API not being available
        const textArea = document.createElement('textarea');
        textArea.value = app.originalInput;
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
      textArea.value = app.originalInput;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
      document.body.removeChild(textArea);
    }
    alert('App original input copied to clipboard! You can paste it in the NLP interface.');
  };

  const handleExportApp = (app: any) => {
    const exportData = {
      name: app.name,
      description: app.description,
      originalInput: app.originalInput,
      domain: app.domain,
      requirements: app.requirements,
      specifications: app.specifications,
      metadata: app.metadata,
      tags: app.tags,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredApps = savedApps.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.parse(app.tags || '[]').some((tag: string) => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const templates = filteredApps.filter(app => app.isTemplate);
  const regularApps = filteredApps.filter(app => !app.isTemplate);

  const renderAppCard = (app: SavedApp) => (
    <Card key={app.id} className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{app.name}</CardTitle>
            <CardDescription className="mt-1">
              {app.description || 'No description'}
            </CardDescription>
          </div>
          {app.isTemplate && (
            <Badge variant="secondary">Template</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {JSON.parse(app.tags || '[]').map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Domain:</strong> {app.domain}</p>
          <p><strong>Created:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleUseApp(app)}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-1" />
            Use
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedApp(app);
              setTemplateViewerOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleExportApp(app)}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedApp(app);
              setDeleteDialogOpen(true);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Apps</h2>
          <p className="text-muted-foreground">
            Manage your saved applications and templates
          </p>
        </div>
        <Button onClick={loadSavedApps} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search apps, descriptions, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {filteredApps.length} app{filteredApps.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="apps">
            My Apps ({regularApps.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="apps" className="mt-6">
          {regularApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularApps.map(renderAppCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Save className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved apps found.</p>
                  <p className="text-sm">Run the NLP pipeline and save your first app!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(renderAppCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Save className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates found.</p>
                  <p className="text-sm">Save an app as a template to get started!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete App Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete App</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedApp?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedApp && handleDeleteApp(selectedApp.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Viewer */}
      {templateViewerOpen && selectedApp && (
        <TemplateViewer
          template={{
            ...selectedApp,
            requirements: JSON.parse(selectedApp.requirements || '{}'),
            specifications: JSON.parse(selectedApp.specifications || '{}'),
            metadata: JSON.parse(selectedApp.metadata || '{}'),
            tags: JSON.parse(selectedApp.tags || '[]')
          }}
          onClose={() => {
            setTemplateViewerOpen(false);
            setSelectedApp(null);
          }}
          onUseTemplate={(template) => {
            handleUseApp(template);
            setTemplateViewerOpen(false);
          }}
        />
      )}
    </div>
  );
}