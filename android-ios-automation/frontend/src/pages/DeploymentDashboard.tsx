'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Play, Square, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Deployment {
  id: string;
  platform: 'android' | 'ios' | 'universal';
  channel: 'google-play' | 'app-store' | 'testflight' | 'firebase' | 's3' | 'github';
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fileName: string;
  packageName?: string;
  bundleId?: string;
  track?: string;
  releaseNotes?: string;
  createdAt: string;
  completedAt?: string;
  progress: number;
  logs: string[];
  downloadUrl?: string;
  releaseUrl?: string;
}

interface DeploymentDashboardProps {
  onDeploy?: (deployment: any) => void;
  onCancel?: (deploymentId: string) => void;
}

export default function DeploymentDashboard({ onDeploy, onCancel }: DeploymentDashboardProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deploymentForm, setDeploymentForm] = useState({
    platform: 'android',
    channel: 'google-play',
    packageName: '',
    bundleId: '',
    track: 'production',
    releaseNotes: '',
    testers: '',
    groups: 'Internal Testing',
    bucketName: '',
    keyPrefix: '',
    owner: '',
    repo: '',
    tagName: '',
    releaseName: ''
  });

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDeployments = async () => {
    try {
      const response = await fetch('/api/deployment');
      const data = await response.json();
      if (data.success) {
        setDeployments(data.deployments);
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const fileInput = document.getElementById('appFile') as HTMLInputElement;
      
      if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a file to deploy');
        return;
      }

      const file = fileInput.files[0];
      formData.append('appFile', file);

      // Add deployment-specific parameters
      switch (deploymentForm.channel) {
        case 'google-play':
          formData.append('packageName', deploymentForm.packageName);
          formData.append('track', deploymentForm.track);
          formData.append('releaseNotes', deploymentForm.releaseNotes);
          break;
        case 'app-store':
          formData.append('bundleId', deploymentForm.bundleId);
          formData.append('releaseNotes', deploymentForm.releaseNotes);
          break;
        case 'testflight':
          formData.append('bundleId', deploymentForm.bundleId);
          formData.append('groups', deploymentForm.groups);
          break;
        case 'firebase':
          formData.append('appId', deploymentForm.bundleId);
          formData.append('releaseNotes', deploymentForm.releaseNotes);
          formData.append('testers', deploymentForm.testers);
          break;
        case 's3':
          formData.append('bucketName', deploymentForm.bucketName);
          formData.append('keyPrefix', deploymentForm.keyPrefix);
          break;
        case 'github':
          formData.append('owner', deploymentForm.owner);
          formData.append('repo', deploymentForm.repo);
          formData.append('tagName', deploymentForm.tagName);
          formData.append('releaseName', deploymentForm.releaseName);
          formData.append('releaseNotes', deploymentForm.releaseNotes);
          break;
      }

      const response = await fetch(`/api/deployment/${deploymentForm.channel}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        // Start polling for deployment status
        pollDeploymentStatus(data.deploymentId);
      } else {
        alert(`Deployment failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed. Please try again.');
    } finally {
      setIsDeploying(false);
      setUploadProgress(0);
    }
  };

  const pollDeploymentStatus = (deploymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/deployment/${deploymentId}`);
        const data = await response.json();
        
        if (data.success) {
          const deployment = data.deployment;
          setDeployments(prev => 
            prev.map(d => d.id === deploymentId ? deployment : d)
          );
          
          if (deployment.status === 'completed' || deployment.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Failed to poll deployment status:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleCancelDeployment = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployment/${deploymentId}/cancel`, {
        method: 'POST',
      });
      
      const data = await response.json();
      if (data.success) {
        fetchDeployments();
      } else {
        alert(`Failed to cancel deployment: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
      alert('Failed to cancel deployment. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getChannelName = (channel: string) => {
    switch (channel) {
      case 'google-play':
        return 'Google Play Store';
      case 'app-store':
        return 'Apple App Store';
      case 'testflight':
        return 'TestFlight';
      case 'firebase':
        return 'Firebase App Distribution';
      case 's3':
        return 'AWS S3';
      case 'github':
        return 'GitHub Releases';
      default:
        return channel;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Dashboard</h1>
          <p className="text-gray-600">Manage and monitor your app deployments across multiple platforms</p>
        </div>
      </div>

      <Tabs defaultValue="deploy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deploy">New Deployment</TabsTrigger>
          <TabsTrigger value="history">Deployment History</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deploy New App</CardTitle>
              <CardDescription>
                Upload your app file and configure deployment settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeploy} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appFile">App File</Label>
                    <Input
                      id="appFile"
                      type="file"
                      accept=".apk,.aab,.ipa,.zip"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={deploymentForm.platform} onValueChange={(value) => setDeploymentForm({...deploymentForm, platform: value as any})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="universal">Universal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="channel">Deployment Channel</Label>
                    <Select value={deploymentForm.channel} onValueChange={(value) => setDeploymentForm({...deploymentForm, channel: value as any})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google-play">Google Play Store</SelectItem>
                        <SelectItem value="app-store">Apple App Store</SelectItem>
                        <SelectItem value="testflight">TestFlight</SelectItem>
                        <SelectItem value="firebase">Firebase App Distribution</SelectItem>
                        <SelectItem value="s3">AWS S3</SelectItem>
                        <SelectItem value="github">GitHub Releases</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {deploymentForm.channel === 'google-play' && (
                    <>
                      <div>
                        <Label htmlFor="packageName">Package Name</Label>
                        <Input
                          id="packageName"
                          value={deploymentForm.packageName}
                          onChange={(e) => setDeploymentForm({...deploymentForm, packageName: e.target.value})}
                          placeholder="com.example.app"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="track">Track</Label>
                        <Select value={deploymentForm.track} onValueChange={(value) => setDeploymentForm({...deploymentForm, track: value})}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="beta">Beta</SelectItem>
                            <SelectItem value="alpha">Alpha</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {deploymentForm.channel === 'app-store' && (
                    <div>
                      <Label htmlFor="bundleId">Bundle ID</Label>
                      <Input
                        id="bundleId"
                        value={deploymentForm.bundleId}
                        onChange={(e) => setDeploymentForm({...deploymentForm, bundleId: e.target.value})}
                        placeholder="com.example.app"
                        required
                        className="mt-1"
                      />
                    </div>
                  )}

                  {deploymentForm.channel === 'testflight' && (
                    <div>
                      <Label htmlFor="groups">Test Groups</Label>
                      <Input
                        id="groups"
                        value={deploymentForm.groups}
                        onChange={(e) => setDeploymentForm({...deploymentForm, groups: e.target.value})}
                        placeholder="Internal Testing"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {deploymentForm.channel === 'firebase' && (
                    <>
                      <div>
                        <Label htmlFor="appId">App ID</Label>
                        <Input
                          id="appId"
                          value={deploymentForm.bundleId}
                          onChange={(e) => setDeploymentForm({...deploymentForm, bundleId: e.target.value})}
                          placeholder="1:123456789:android:abcdef123456"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="testers">Testers (comma-separated)</Label>
                        <Input
                          id="testers"
                          value={deploymentForm.testers}
                          onChange={(e) => setDeploymentForm({...deploymentForm, testers: e.target.value})}
                          placeholder="test1@example.com,test2@example.com"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}

                  {deploymentForm.channel === 's3' && (
                    <>
                      <div>
                        <Label htmlFor="bucketName">Bucket Name</Label>
                        <Input
                          id="bucketName"
                          value={deploymentForm.bucketName}
                          onChange={(e) => setDeploymentForm({...deploymentForm, bucketName: e.target.value})}
                          placeholder="my-app-bucket"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="keyPrefix">Key Prefix (optional)</Label>
                        <Input
                          id="keyPrefix"
                          value={deploymentForm.keyPrefix}
                          onChange={(e) => setDeploymentForm({...deploymentForm, keyPrefix: e.target.value})}
                          placeholder="releases/"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}

                  {deploymentForm.channel === 'github' && (
                    <>
                      <div>
                        <Label htmlFor="owner">Repository Owner</Label>
                        <Input
                          id="owner"
                          value={deploymentForm.owner}
                          onChange={(e) => setDeploymentForm({...deploymentForm, owner: e.target.value})}
                          placeholder="username"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="repo">Repository Name</Label>
                        <Input
                          id="repo"
                          value={deploymentForm.repo}
                          onChange={(e) => setDeploymentForm({...deploymentForm, repo: e.target.value})}
                          placeholder="my-app"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tagName">Tag Name</Label>
                        <Input
                          id="tagName"
                          value={deploymentForm.tagName}
                          onChange={(e) => setDeploymentForm({...deploymentForm, tagName: e.target.value})}
                          placeholder="v1.0.0"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="releaseName">Release Name</Label>
                        <Input
                          id="releaseName"
                          value={deploymentForm.releaseName}
                          onChange={(e) => setDeploymentForm({...deploymentForm, releaseName: e.target.value})}
                          placeholder="Version 1.0.0"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <Label htmlFor="releaseNotes">Release Notes</Label>
                  <Textarea
                    id="releaseNotes"
                    value={deploymentForm.releaseNotes}
                    onChange={(e) => setDeploymentForm({...deploymentForm, releaseNotes: e.target.value})}
                    placeholder="Describe what's new in this release..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {isDeploying && (
                  <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                <Button type="submit" disabled={isDeploying} className="w-full">
                  {isDeploying ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Deployment
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Deployment History</CardTitle>
                  <CardDescription>
                    View all your recent deployments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {deployments.map((deployment) => (
                        <div
                          key={deployment.id}
                          className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            selectedDeployment?.id === deployment.id ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedDeployment(deployment)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(deployment.status)}
                              <div>
                                <div className="font-medium">{deployment.fileName}</div>
                                <div className="text-sm text-gray-500">
                                  {getChannelName(deployment.channel)} • {deployment.platform}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(deployment.status)}>
                                {deployment.status}
                              </Badge>
                              {deployment.status === 'pending' || deployment.status === 'uploading' || deployment.status === 'processing' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelDeployment(deployment.id);
                                  }}
                                >
                                  <Square className="h-4 w-4" />
                                </Button>
                              ) : null}
                              {(deployment.downloadUrl || deployment.releaseUrl) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(deployment.downloadUrl || deployment.releaseUrl, '_blank');
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress value={deployment.progress} className="w-full" />
                            <div className="text-xs text-gray-500 mt-1">
                              {deployment.progress}% complete
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div>
              {selectedDeployment ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Deployment Details</CardTitle>
                    <CardDescription>
                      {selectedDeployment.fileName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(selectedDeployment.status)}
                          <Badge className={getStatusColor(selectedDeployment.status)}>
                            {selectedDeployment.status}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Platform</Label>
                        <div className="mt-1">{selectedDeployment.platform}</div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Channel</Label>
                        <div className="mt-1">{getChannelName(selectedDeployment.channel)}</div>
                      </div>

                      {selectedDeployment.packageName && (
                        <div>
                          <Label className="text-sm font-medium">Package Name</Label>
                          <div className="mt-1">{selectedDeployment.packageName}</div>
                        </div>
                      )}

                      {selectedDeployment.bundleId && (
                        <div>
                          <Label className="text-sm font-medium">Bundle ID</Label>
                          <div className="mt-1">{selectedDeployment.bundleId}</div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <div className="mt-1">{new Date(selectedDeployment.createdAt).toLocaleString()}</div>
                      </div>

                      {selectedDeployment.completedAt && (
                        <div>
                          <Label className="text-sm font-medium">Completed</Label>
                          <div className="mt-1">{new Date(selectedDeployment.completedAt).toLocaleString()}</div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Progress</Label>
                        <div className="mt-1">
                          <Progress value={selectedDeployment.progress} className="w-full" />
                          <div className="text-xs text-gray-500 mt-1">
                            {selectedDeployment.progress}% complete
                          </div>
                        </div>
                      </div>

                      {selectedDeployment.releaseNotes && (
                        <div>
                          <Label className="text-sm font-medium">Release Notes</Label>
                          <div className="mt-1 text-sm">{selectedDeployment.releaseNotes}</div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Logs</Label>
                        <ScrollArea className="h-32 mt-1">
                          <div className="text-xs space-y-1">
                            {selectedDeployment.logs.map((log, index) => (
                              <div key={index} className="text-gray-600">
                                {log}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-gray-500">
                      <p>Select a deployment to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}