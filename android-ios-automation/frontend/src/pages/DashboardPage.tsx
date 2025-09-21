import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Code, Database, GitBranch, Monitor, Smartphone, Upload, Zap, Rocket } from "lucide-react";
import { useRouter } from "next/router";

interface SystemStatus {
  auth: boolean;
  nlp: boolean;
  codegen: boolean;
  build: boolean;
  deployment: boolean;
  monitoring: boolean;
}

export function DashboardPage() {
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    auth: false,
    nlp: false,
    codegen: false,
    build: false,
    deployment: false,
    monitoring: false,
  });

  useEffect(() => {
    // Simulate checking system status
    const checkStatus = async () => {
      // In a real app, this would make API calls to check service health
      setTimeout(() => {
        setSystemStatus({
          auth: true,
          nlp: true,
          codegen: true,
          build: true,
          deployment: true,
          monitoring: true,
        });
      }, 1000);
    };

    checkStatus();
  }, []);

  const getStatusColor = (status: boolean) => {
    return status ? "text-green-600" : "text-red-600";
  };

  const getStatusText = (status: boolean) => {
    return status ? "Online" : "Offline";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            App Automation Platform
          </h1>
          <p className="text-gray-600">
            Transform text and voice descriptions into fully functional mobile applications
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No projects yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apps Generated</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Android & iOS</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Build Success Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">No builds yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(systemStatus).filter(Boolean).length}/{Object.values(systemStatus).length}
              </div>
              <p className="text-xs text-muted-foreground">Services online</p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of all platform services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Auth Service</span>
                </div>
                <span className={`font-medium ${getStatusColor(systemStatus.auth)}`}>
                  {getStatusText(systemStatus.auth)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>NLP Service</span>
                </div>
                <span className={`font-medium ${getStatusColor(systemStatus.nlp)}`}>
                  {getStatusText(systemStatus.nlp)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Code Generation</span>
                </div>
                <span className={`font-medium ${getStatusColor(systemStatus.codegen)}`}>
                  {getStatusText(systemStatus.codegen)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5" />
                  <span>Build Service</span>
                </div>
                <span className={`font-medium ${getStatusColor(systemStatus.build)}`}>
                  {getStatusText(systemStatus.build)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Deployment Service</span>
                </div>
                <span className={`font-medium ${getStatusColor(systemStatus.deployment)}`}>
                  {getStatusText(systemStatus.deployment)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Monitoring Service</span>
                </div>
                <span className={`font-medium ${getStatusColor(systemStatus.monitoring)}`}>
                  {getStatusText(systemStatus.monitoring)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with creating your first mobile application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-20 flex-col space-y-2" disabled>
                <Upload className="h-6 w-6" />
                <span>New Project</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline" disabled>
                <Smartphone className="h-6 w-6" />
                <span>View Projects</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline" onClick={() => router.push('/deployment')}>
                <Rocket className="h-6 w-6" />
                <span>Deploy App</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline" disabled>
                <Monitor className="h-6 w-6" />
                <span>System Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
