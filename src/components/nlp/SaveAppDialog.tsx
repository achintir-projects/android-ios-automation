'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, Plus, X } from 'lucide-react';

interface SaveAppDialogProps {
  appName: string;
  appDescription: string;
  originalInput: string;
  domain: string;
  requirements: any;
  specifications: any;
  onSave?: (savedApp: any) => void;
  children?: React.ReactNode;
}

export default function SaveAppDialog({
  appName,
  appDescription,
  originalInput,
  domain,
  requirements,
  specifications,
  onSave,
  children
}: SaveAppDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: appName,
    description: appDescription,
    isTemplate: false,
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter an app name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/saved-apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          originalInput,
          domain,
          requirements,
          specifications,
          isTemplate: formData.isTemplate,
          tags: formData.tags
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSave?.(result.data);
        setOpen(false);
        // Reset form
        setFormData({
          name: appName,
          description: appDescription,
          isTemplate: false,
          tags: []
        });
      } else {
        alert(result.error || 'Failed to save app');
      }
    } catch (error) {
      console.error('Error saving app:', error);
      alert('Failed to save app');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save App
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Save App</DialogTitle>
          <DialogDescription>
            Save this app and its requirements for future reference and builds.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">App Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter app name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter app description"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="template"
              checked={formData.isTemplate}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isTemplate: !!checked }))
              }
            />
            <Label htmlFor="template">Save as template for future apps</Label>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Domain:</strong> {domain}</p>
            <p><strong>Original Input:</strong> {originalInput.substring(0, 100)}...</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.name.trim()}>
            {loading ? 'Saving...' : 'Save App'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}