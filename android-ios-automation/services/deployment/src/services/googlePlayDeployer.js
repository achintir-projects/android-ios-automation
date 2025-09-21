const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger').setupLogger();

class GooglePlayDeployer {
  constructor() {
    this.androidPublisher = null;
    this.auth = null;
  }

  async authenticate() {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_PLAY_CREDENTIALS || '{}');
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher']
      });

      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: this.auth
      });

      logger.info('Google Play API authentication successful');
    } catch (error) {
      logger.error('Google Play authentication failed:', error);
      throw new Error('Failed to authenticate with Google Play API');
    }
  }

  async deploy(deploymentData) {
    try {
      await this.authenticate();
      
      deploymentData.status = 'uploading';
      deploymentData.progress = 10;
      deploymentData.logs.push('Starting Google Play deployment...');

      const { packageName, filePath, track = 'production', releaseNotes } = deploymentData;

      // Read the app file (APK or AAB)
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const isAAB = fileName.endsWith('.aab');

      deploymentData.logs.push(`Uploading ${isAAB ? 'AAB' : 'APK'} file...`);
      deploymentData.progress = 20;

      // Create edit
      const edit = await this.androidPublisher.edits.insert({
        packageName,
        resource: {}
      });

      const editId = edit.data.id;
      deploymentData.logs.push('Created edit session');
      deploymentData.progress = 30;

      // Upload the app file
      let uploadResult;
      if (isAAB) {
        uploadResult = await this.androidPublisher.edits.bundles.upload({
          packageName,
          editId,
          media: {
            mimeType: 'application/octet-stream',
            body: fileBuffer
          }
        });
      } else {
        uploadResult = await this.androidPublisher.edits.apks.upload({
          packageName,
          editId,
          media: {
            mimeType: 'application/vnd.android.package-archive',
            body: fileBuffer
          }
        });
      }

      const versionCode = uploadResult.data.versionCode;
      deploymentData.logs.push(`File uploaded successfully. Version code: ${versionCode}`);
      deploymentData.progress = 50;

      // Create release
      const release = {
        name: `v${versionCode}`,
        versionCodes: [versionCode.toString()],
        releaseNotes: releaseNotes ? [{
          language: 'en-US',
          text: releaseNotes
        }] : [],
        status: 'completed'
      };

      // Assign to track
      await this.androidPublisher.edits.tracks.update({
        packageName,
        editId,
        track,
        resource: { releases: [release] }
      });

      deploymentData.logs.push(`Release assigned to ${track} track`);
      deploymentData.progress = 70;

      // Commit the edit
      await this.androidPublisher.edits.commit({
        packageName,
        editId
      });

      deploymentData.status = 'completed';
      deploymentData.progress = 100;
      deploymentData.logs.push('Deployment completed successfully!');
      deploymentData.completedAt = new Date().toISOString();

      logger.info(`Google Play deployment completed for ${packageName}`);

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
      logger.error('Google Play deployment failed:', error);
      throw error;
    }
  }

  async getTracks(packageName) {
    try {
      await this.authenticate();
      
      const response = await this.androidPublisher.edits.tracks.list({
        packageName,
        editId: 'current'
      });

      return response.data.tracks || [];
    } catch (error) {
      logger.error('Failed to get tracks:', error);
      throw error;
    }
  }

  async getReleases(packageName, track) {
    try {
      await this.authenticate();
      
      const response = await this.androidPublisher.edits.tracks.get({
        packageName,
        editId: 'current',
        track
      });

      return response.data.releases || [];
    } catch (error) {
      logger.error('Failed to get releases:', error);
      throw error;
    }
  }
}

module.exports = GooglePlayDeployer;