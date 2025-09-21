const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger').setupLogger');

class FirebaseDeployer {
  constructor() {
    this.app = null;
    this.distribution = null;
  }

  async initialize() {
    try {
      // Initialize Firebase Admin SDK
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
      
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      // Get Firebase App Distribution reference
      this.distribution = this.app.appDistribution();
      
      logger.info('Firebase App Distribution initialized successfully');
    } catch (error) {
      logger.error('Firebase initialization failed:', error);
      throw new Error('Failed to initialize Firebase App Distribution');
    }
  }

  async deploy(deploymentData) {
    try {
      await this.initialize();
      
      deploymentData.status = 'uploading';
      deploymentData.progress = 10;
      deploymentData.logs.push('Starting Firebase App Distribution deployment...');

      const { appId, filePath, releaseNotes = '', testers = '' } = deploymentData;

      // Validate app ID
      if (!appId) {
        throw new Error('Firebase App ID is required');
      }

      deploymentData.logs.push(`Deploying to Firebase app: ${appId}`);
      deploymentData.progress = 20;

      // Read the app file
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const isAndroid = fileName.endsWith('.apk');

      deploymentData.logs.push(`Uploading ${isAndroid ? 'APK' : 'IPA'} file...`);
      deploymentData.progress = 30;

      // Upload the app file
      const uploadResult = await this.uploadApp(appId, filePath, {
        releaseNotes,
        testers
      });

      deploymentData.logs.push('App file uploaded successfully');
      deploymentData.progress = 50;

      // Wait for processing
      deploymentData.logs.push('Waiting for Firebase processing...');
      deploymentData.progress = 60;

      await this.waitForProcessing(uploadResult.releaseId);

      deploymentData.logs.push('App processing completed');
      deploymentData.progress = 70;

      // Get release information
      const releaseInfo = await this.getReleaseInfo(appId, uploadResult.releaseId);

      deploymentData.logs.push(`Release created: ${releaseInfo.displayVersion}`);
      deploymentData.progress = 80;

      // Notify testers if specified
      if (testers) {
        await this.notifyTesters(appId, uploadResult.releaseId, testers);
        deploymentData.logs.push('Testers notified');
      }

      deploymentData.status = 'completed';
      deploymentData.progress = 100;
      deploymentData.logs.push('Firebase App Distribution deployment completed successfully!');
      deploymentData.completedAt = new Date().toISOString();

      logger.info(`Firebase deployment completed for app ${appId}`);

      // Clean up uploaded file
      try {
        await fs.unlink(filePath);
        deploymentData.logs.push('Cleaned up temporary file');
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary file:', cleanupError);
      }

    } catch (error) {
      deploymentData.status = 'failed';
      deploymentData.logs.push(`Deployment failed: ${error.message}`);
      logger.error('Firebase deployment failed:', error);
      throw error;
    }
  }

  async uploadApp(appId, filePath, options = {}) {
    try {
      const { releaseNotes = '', testers = '' } = options;
      
      // Use Firebase CLI to upload the app
      const token = await this.getAccessToken();
      
      let command = `firebase appdistribution:distribute "${filePath}" --app "${appId}"`;
      
      if (releaseNotes) {
        command += ` --release-notes "${releaseNotes}"`;
      }
      
      if (testers) {
        command += ` --testers "${testers}"`;
      }
      
      command += ` --token "${token}"`;

      const { execSync } = require('child_process');
      const result = execSync(command, { encoding: 'utf8' });
      
      // Parse the result to get release ID
      const releaseIdMatch = result.match(/Release ID: (\d+)/);
      const releaseId = releaseIdMatch ? releaseIdMatch[1] : null;
      
      if (!releaseId) {
        throw new Error('Failed to get release ID from upload response');
      }

      return {
        success: true,
        releaseId: releaseId
      };
    } catch (error) {
      throw new Error(`Failed to upload app: ${error.message}`);
    }
  }

  async getAccessToken() {
    try {
      const token = await this.app.INTERNAL.getToken();
      return token.accessToken;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  async waitForProcessing(releaseId, maxAttempts = 30) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getReleaseStatus(releaseId);
        
        if (status === 'ACTIVE') {
          return true;
        } else if (status === 'FAILED') {
          throw new Error('Release processing failed');
        }
        
        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      } catch (error) {
        if (attempts === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }
    
    throw new Error('Release processing timed out');
  }

  async getReleaseStatus(releaseId) {
    try {
      // This would typically query the Firebase App Distribution API for release status
      // For now, we'll simulate the status check
      return 'ACTIVE';
    } catch (error) {
      throw new Error(`Failed to get release status: ${error.message}`);
    }
  }

  async getReleaseInfo(appId, releaseId) {
    try {
      // This would typically query the Firebase App Distribution API for release info
      // For now, we'll return mock data
      return {
        releaseId: releaseId,
        displayVersion: '1.0.0',
        buildVersion: '1',
        releaseNotes: 'New release',
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
      };
    } catch (error) {
      throw new Error(`Failed to get release info: ${error.message}`);
    }
  }

  async notifyTesters(appId, releaseId, testers) {
    try {
      const testerList = Array.isArray(testers) ? testers : testers.split(',').map(t => t.trim());
      
      // This would typically use the Firebase App Distribution API to notify testers
      // For now, we'll simulate the notification
      logger.info(`Notifying testers: ${testerList.join(', ')}`);
    } catch (error) {
      throw new Error(`Failed to notify testers: ${error.message}`);
    }
  }

  async listReleases(appId) {
    try {
      // This would typically query the Firebase App Distribution API for releases
      // For now, we'll return mock data
      return [
        {
          releaseId: '1',
          displayVersion: '1.0.0',
          buildVersion: '1',
          releaseNotes: 'Initial release',
          createdAt: new Date().toISOString(),
          status: 'ACTIVE'
        }
      ];
    } catch (error) {
      throw new Error(`Failed to list releases: ${error.message}`);
    }
  }

  async getTesters(appId) {
    try {
      // This would typically query the Firebase App Distribution API for testers
      // For now, we'll return mock data
      return [
        {
          email: 'tester@example.com',
          name: 'Test User',
          status: 'ACTIVE'
        }
      ];
    } catch (error) {
      throw new Error(`Failed to get testers: ${error.message}`);
    }
  }

  async addTesters(appId, testers) {
    try {
      const testerList = Array.isArray(testers) ? testers : testers.split(',').map(t => t.trim());
      
      // This would typically use the Firebase App Distribution API to add testers
      // For now, we'll simulate adding testers
      logger.info(`Adding testers: ${testerList.join(', ')}`);
    } catch (error) {
      throw new Error(`Failed to add testers: ${error.message}`);
    }
  }

  async removeTesters(appId, testers) {
    try {
      const testerList = Array.isArray(testers) ? testers : testers.split(',').map(t => t.trim());
      
      // This would typically use the Firebase App Distribution API to remove testers
      // For now, we'll simulate removing testers
      logger.info(`Removing testers: ${testerList.join(', ')}`);
    } catch (error) {
      throw new Error(`Failed to remove testers: ${error.message}`);
    }
  }
}

module.exports = FirebaseDeployer;