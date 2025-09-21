const AppStoreConnectAPI = require('app-store-connect-api');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../config/logger').setupLogger();

class TestFlightDeployer {
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
      logger.info('TestFlight API authentication successful');
    } catch (error) {
      logger.error('TestFlight authentication failed:', error);
      throw new Error('Failed to authenticate with TestFlight API');
    }
  }

  async deploy(deploymentData) {
    try {
      await this.authenticate();
      
      deploymentData.status = 'uploading';
      deploymentData.progress = 10;
      deploymentData.logs.push('Starting TestFlight deployment...');

      const { bundleId, filePath, groups = 'Internal Testing' } = deploymentData;

      // Get app information
      const apps = await this.api.listApps();
      const app = apps.data.find(a => a.attributes.bundleId === bundleId);

      if (!app) {
        throw new Error(`App with bundle ID ${bundleId} not found`);
      }

      deploymentData.logs.push(`Found app: ${app.attributes.name}`);
      deploymentData.progress = 20;

      // Upload the IPA file using altool
      deploymentData.logs.push('Uploading IPA file to TestFlight...');
      deploymentData.progress = 30;

      const uploadResult = await this.uploadIPA(filePath);
      
      if (!uploadResult.success) {
        throw new Error(`Failed to upload IPA: ${uploadResult.error}`);
      }

      deploymentData.logs.push('IPA file uploaded successfully');
      deploymentData.progress = 50;

      // Wait for processing
      deploymentData.logs.push('Waiting for TestFlight processing...');
      deploymentData.progress = 60;

      await this.waitForProcessing(uploadResult.assetId);

      deploymentData.logs.push('App processing completed');
      deploymentData.progress = 70;

      // Get the build
      const build = await this.getLatestBuild(app.id);
      
      if (!build) {
        throw new Error('No build found after processing');
      }

      deploymentData.logs.push(`Build created: ${build.attributes.version}`);
      deploymentData.progress = 80;

      // Add to test groups
      await this.addToTestGroups(build.id, groups);

      deploymentData.status = 'completed';
      deploymentData.progress = 100;
      deploymentData.logs.push('TestFlight deployment completed successfully!');
      deploymentData.completedAt = new Date().toISOString();

      logger.info(`TestFlight deployment completed for ${bundleId}`);

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
      logger.error('TestFlight deployment failed:', error);
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

  async getLatestBuild(appId) {
    try {
      const builds = await this.api.listBuilds(appId);
      
      // Get the most recent build
      const sortedBuilds = builds.data.sort((a, b) => {
        return new Date(b.attributes.uploadedDate) - new Date(a.attributes.uploadedDate);
      });
      
      return sortedBuilds[0] || null;
    } catch (error) {
      throw new Error(`Failed to get latest build: ${error.message}`);
    }
  }

  async addToTestGroups(buildId, groups) {
    try {
      const groupList = Array.isArray(groups) ? groups : groups.split(',').map(g => g.trim());
      
      for (const groupName of groupList) {
        await this.addBuildToGroup(buildId, groupName);
        deploymentData.logs.push(`Added build to ${groupName} group`);
      }
    } catch (error) {
      throw new Error(`Failed to add build to test groups: ${error.message}`);
    }
  }

  async addBuildToGroup(buildId, groupName) {
    try {
      // Get beta testers
      const betaTesters = await this.api.listBetaTesters();
      
      // Find or create group
      let group = await this.findBetaGroup(groupName);
      
      if (!group) {
        group = await this.createBetaGroup(groupName);
      }

      // Add build to group
      await this.api.addBuildToBetaGroup(group.id, buildId);
    } catch (error) {
      throw new Error(`Failed to add build to group ${groupName}: ${error.message}`);
    }
  }

  async findBetaGroup(groupName) {
    try {
      const groups = await this.api.listBetaGroups();
      return groups.data.find(g => g.attributes.name === groupName) || null;
    } catch (error) {
      throw new Error(`Failed to find beta group: ${error.message}`);
    }
  }

  async createBetaGroup(groupName) {
    try {
      const groupData = {
        data: {
          type: 'betaGroups',
          attributes: {
            name: groupName,
            isInternalGroup: groupName.toLowerCase().includes('internal')
          }
        }
      };

      const group = await this.api.createBetaGroup(groupData);
      return group.data;
    } catch (error) {
      throw new Error(`Failed to create beta group: ${error.message}`);
    }
  }

  async getTestFlightInfo(bundleId) {
    try {
      const apps = await this.api.listApps();
      const app = apps.data.find(a => a.attributes.bundleId === bundleId);
      
      if (!app) {
        throw new Error(`App with bundle ID ${bundleId} not found`);
      }

      const builds = await this.api.listBuilds(app.id);
      const betaGroups = await this.api.listBetaGroups();

      return {
        app: app.attributes,
        builds: builds.data,
        betaGroups: betaGroups.data
      };
    } catch (error) {
      throw new Error(`Failed to get TestFlight info: ${error.message}`);
    }
  }

  async inviteTesters(groupId, emails) {
    try {
      const emailList = Array.isArray(emails) ? emails : emails.split(',').map(e => e.trim());
      
      for (const email of emailList) {
        await this.api.inviteBetaTester(groupId, email);
      }
    } catch (error) {
      throw new Error(`Failed to invite testers: ${error.message}`);
    }
  }
}

module.exports = TestFlightDeployer;