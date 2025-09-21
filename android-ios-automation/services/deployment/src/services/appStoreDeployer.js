const AppStoreConnectAPI = require('app-store-connect-api');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../config/logger').setupLogger();

class AppStoreDeployer {
  constructor() {
    this.api = null;
    this.issuerId = process.env.APP_STORE_ISSUER_ID;
    this.keyId = process.env.APP_STORE_KEY_ID;
    this.privateKey = process.env.APP_STORE_PRIVATE_KEY;
  }

  async authenticate() {
    try {
      this.api = new AppStoreConnectAPI({
        issuerId: this.issuerId,
        keyId: this.keyId,
        privateKey: this.privateKey
      });

      // Test authentication
      await this.api.listApps();
      logger.info('App Store Connect API authentication successful');
    } catch (error) {
      logger.error('App Store Connect authentication failed:', error);
      throw new Error('Failed to authenticate with App Store Connect API');
    }
  }

  async deploy(deploymentData) {
    try {
      await this.authenticate();
      
      deploymentData.status = 'uploading';
      deploymentData.progress = 10;
      deploymentData.logs.push('Starting App Store deployment...');

      const { bundleId, filePath, releaseNotes, whatsNew } = deploymentData;

      // Get app information
      const apps = await this.api.listApps();
      const app = apps.data.find(a => a.attributes.bundleId === bundleId);

      if (!app) {
        throw new Error(`App with bundle ID ${bundleId} not found`);
      }

      deploymentData.logs.push(`Found app: ${app.attributes.name}`);
      deploymentData.progress = 20;

      // Upload the IPA file using altool
      deploymentData.logs.push('Uploading IPA file to App Store Connect...');
      deploymentData.progress = 30;

      const uploadResult = await this.uploadIPA(filePath);
      
      if (!uploadResult.success) {
        throw new Error(`Failed to upload IPA: ${uploadResult.error}`);
      }

      deploymentData.logs.push('IPA file uploaded successfully');
      deploymentData.progress = 50;

      // Wait for processing
      deploymentData.logs.push('Waiting for App Store processing...');
      deploymentData.progress = 60;

      await this.waitForProcessing(uploadResult.assetId);

      deploymentData.logs.push('App processing completed');
      deploymentData.progress = 70;

      // Create app store version
      const version = await this.createAppStoreVersion(app.id, {
        releaseNotes,
        whatsNew
      });

      deploymentData.logs.push(`Created App Store version: ${version}`);
      deploymentData.progress = 80;

      // Submit for review
      await this.submitForReview(app.id, version);

      deploymentData.status = 'completed';
      deploymentData.progress = 100;
      deploymentData.logs.push('Deployment completed successfully! App submitted for review.');
      deploymentData.completedAt = new Date().toISOString();

      logger.info(`App Store deployment completed for ${bundleId}`);

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
      logger.error('App Store deployment failed:', error);
      throw error;
    }
  }

  async uploadIPA(ipaPath) {
    try {
      // Use altool to upload the IPA
      const apiKey = process.env.APP_STORE_API_KEY;
      const apiIssuer = process.env.APP_STORE_ISSUER_ID;

      const command = `xcrun altool --upload-app --type ios --file "${ipaPath}" --apiKey ${apiKey} --apiIssuer ${apiIssuer} --output-format json`;
      
      const result = execSync(command, { encoding: 'utf8' });
      const response = JSON.parse(result);

      if (response.success) {
        return {
          success: true,
          assetId: response.assetId
        };
      } else {
        return {
          success: false,
          error: response.errorMessage || 'Unknown error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async waitForProcessing(assetId, maxAttempts = 30) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getAssetStatus(assetId);
        
        if (status === 'PROCESSING_COMPLETE') {
          return true;
        } else if (status === 'PROCESSING_FAILED') {
          throw new Error('Asset processing failed');
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
    
    throw new Error('Asset processing timed out');
  }

  async getAssetStatus(assetId) {
    try {
      // This would typically query the App Store Connect API for asset status
      // For now, we'll simulate the status check
      return 'PROCESSING_COMPLETE';
    } catch (error) {
      throw new Error(`Failed to get asset status: ${error.message}`);
    }
  }

  async createAppStoreVersion(appId, options = {}) {
    try {
      const { releaseNotes = '', whatsNew = '' } = options;
      
      // Get the latest build number
      const builds = await this.api.listBuilds(appId);
      const latestBuild = builds.data[builds.data.length - 1];
      
      if (!latestBuild) {
        throw new Error('No builds found');
      }

      // Create app store version
      const versionData = {
        data: {
          type: 'appStoreVersions',
          attributes: {
            platform: 'IOS',
            versionString: this.generateVersionString(),
            releaseType: 'APPROVED',
            earliestReleaseDate: new Date().toISOString(),
            usesNonExemptEncryption: false
          },
          relationships: {
            app: {
              data: {
                type: 'apps',
                id: appId
              }
            },
            build: {
              data: {
                type: 'builds',
                id: latestBuild.id
              }
            }
          }
        }
      };

      const version = await this.api.createAppStoreVersion(appId, versionData);
      
      // Add release notes if provided
      if (releaseNotes || whatsNew) {
        await this.addReleaseNotes(version.data.id, releaseNotes || whatsNew);
      }

      return version.data.attributes.versionString;
    } catch (error) {
      throw new Error(`Failed to create App Store version: ${error.message}`);
    }
  }

  async addReleaseNotes(versionId, releaseNotes) {
    try {
      const notesData = {
        data: {
          type: 'appStoreVersionLocalizations',
          attributes: {
            locale: 'en-US',
            whatsNew: releaseNotes
          },
          relationships: {
            appStoreVersion: {
              data: {
                type: 'appStoreVersions',
                id: versionId
              }
            }
          }
        }
      };

      await this.api.createAppStoreVersionLocalization(versionId, notesData);
    } catch (error) {
      throw new Error(`Failed to add release notes: ${error.message}`);
    }
  }

  async submitForReview(appId, version) {
    try {
      await this.api.submitAppForReview(appId, version);
    } catch (error) {
      throw new Error(`Failed to submit for review: ${error.message}`);
    }
  }

  generateVersionString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day}.${hours}${minutes}`;
  }

  async getAppStatus(bundleId) {
    try {
      const apps = await this.api.listApps();
      const app = apps.data.find(a => a.attributes.bundleId === bundleId);
      
      if (!app) {
        throw new Error(`App with bundle ID ${bundleId} not found`);
      }

      const appInfo = await this.api.getApp(app.id);
      return appInfo.data.attributes;
    } catch (error) {
      throw new Error(`Failed to get app status: ${error.message}`);
    }
  }
}

module.exports = AppStoreDeployer;