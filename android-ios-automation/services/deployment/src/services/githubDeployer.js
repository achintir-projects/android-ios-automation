const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger').setupLogger();

class GitHubDeployer {
  constructor() {
    this.octokit = null;
    this.owner = null;
    this.repo = null;
  }

  async authenticate() {
    try {
      const token = process.env.GITHUB_TOKEN;
      
      if (!token) {
        throw new Error('GitHub token is required');
      }

      this.octokit = new Octokit({
        auth: token
      });

      // Test authentication
      const { data } = await this.octokit.rest.users.getAuthenticated();
      logger.info(`GitHub authentication successful for user: ${data.login}`);
    } catch (error) {
      logger.error('GitHub authentication failed:', error);
      throw new Error('Failed to authenticate with GitHub');
    }
  }

  async deploy(deploymentData) {
    try {
      await this.authenticate();
      
      deploymentData.status = 'uploading';
      deploymentData.progress = 10;
      deploymentData.logs.push('Starting GitHub Releases deployment...');

      const { owner, repo, filePath, tagName, releaseName, releaseNotes = '' } = deploymentData;

      // Validate required parameters
      if (!owner || !repo || !tagName) {
        throw new Error('Owner, repo, and tag name are required');
      }

      this.owner = owner;
      this.repo = repo;

      deploymentData.logs.push(`Deploying to GitHub repository: ${owner}/${repo}`);
      deploymentData.progress = 20;

      // Check if repository exists
      await this.checkRepositoryExists(owner, repo);

      deploymentData.progress = 30;

      // Check if tag already exists
      const tagExists = await this.checkTagExists(tagName);
      
      if (tagExists) {
        throw new Error(`Tag ${tagName} already exists`);
      }

      deploymentData.logs.push(`Creating release: ${tagName}`);
      deploymentData.progress = 40;

      // Read the app file
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      // Create release
      const release = await this.createRelease({
        tagName,
        releaseName: releaseName || tagName,
        releaseNotes,
        fileName,
        fileSize: fileBuffer.length
      });

      deploymentData.logs.push('Release created successfully');
      deploymentData.progress = 60;

      // Upload the file as a release asset
      const asset = await this.uploadReleaseAsset(release.id, fileName, fileBuffer);

      deploymentData.logs.push(`Release asset uploaded: ${asset.name}`);
      deploymentData.progress = 80;

      // Get release URL
      const releaseUrl = release.html_url;

      deploymentData.logs.push(`Release URL: ${releaseUrl}`);
      deploymentData.progress = 90;

      deploymentData.status = 'completed';
      deploymentData.progress = 100;
      deploymentData.logs.push('GitHub Releases deployment completed successfully!');
      deploymentData.completedAt = new Date().toISOString();
      deploymentData.releaseUrl = releaseUrl;

      logger.info(`GitHub deployment completed for release ${tagName}`);

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
      logger.error('GitHub deployment failed:', error);
      throw error;
    }
  }

  async checkRepositoryExists(owner, repo) {
    try {
      await this.octokit.rest.repos.get({
        owner,
        repo
      });
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found`);
      }
      throw error;
    }
  }

  async checkTagExists(tagName) {
    try {
      const { data } = await this.octokit.rest.repos.listTags({
        owner: this.owner,
        repo: this.repo
      });

      return data.some(tag => tag.name === tagName);
    } catch (error) {
      throw new Error(`Failed to check tag existence: ${error.message}`);
    }
  }

  async createRelease(options) {
    try {
      const { tagName, releaseName, releaseNotes, fileName, fileSize } = options;

      const { data } = await this.octokit.rest.repos.createRelease({
        owner: this.owner,
        repo: this.repo,
        tag_name: tagName,
        name: releaseName,
        body: releaseNotes || `Release ${tagName}\n\nFiles:\n- ${fileName} (${this.formatFileSize(fileSize)})`,
        draft: false,
        prerelease: false,
        generate_release_notes: false
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to create release: ${error.message}`);
    }
  }

  async uploadReleaseAsset(releaseId, fileName, fileBuffer) {
    try {
      const { data } = await this.octokit.rest.repos.uploadReleaseAsset({
        owner: this.owner,
        repo: this.repo,
        release_id: releaseId,
        name: fileName,
        data: fileBuffer,
        headers: {
          'Content-Type': this.getContentType(fileName),
          'Content-Length': fileBuffer.length
        }
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to upload release asset: ${error.message}`);
    }
  }

  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    
    switch (ext) {
      case '.apk':
        return 'application/vnd.android.package-archive';
      case '.ipa':
        return 'application/octet-stream';
      case '.zip':
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async listReleases(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.listReleases({
        owner,
        repo
      });

      return data.map(release => ({
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        url: release.html_url,
        assets: release.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          size: asset.size,
          downloadCount: asset.download_count,
          downloadUrl: asset.browser_download_url,
          createdAt: asset.created_at
        }))
      }));
    } catch (error) {
      throw new Error(`Failed to list releases: ${error.message}`);
    }
  }

  async getRelease(owner, repo, releaseId) {
    try {
      const { data } = await this.octokit.rest.repos.getRelease({
        owner,
        repo,
        release_id: releaseId
      });

      return {
        id: data.id,
        tagName: data.tag_name,
        name: data.name,
        body: data.body,
        draft: data.draft,
        prerelease: data.prerelease,
        createdAt: data.created_at,
        publishedAt: data.published_at,
        url: data.html_url,
        assets: data.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          size: asset.size,
          downloadCount: asset.download_count,
          downloadUrl: asset.browser_download_url,
          createdAt: asset.created_at
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get release: ${error.message}`);
    }
  }

  async updateRelease(owner, repo, releaseId, options) {
    try {
      const { tagName, name, body, draft, prerelease } = options;

      const { data } = await this.octokit.rest.repos.updateRelease({
        owner,
        repo,
        release_id: releaseId,
        tag_name: tagName,
        name,
        body,
        draft,
        prerelease
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to update release: ${error.message}`);
    }
  }

  async deleteRelease(owner, repo, releaseId) {
    try {
      await this.octokit.rest.repos.deleteRelease({
        owner,
        repo,
        release_id: releaseId
      });
    } catch (error) {
      throw new Error(`Failed to delete release: ${error.message}`);
    }
  }

  async deleteReleaseAsset(owner, repo, assetId) {
    try {
      await this.octokit.rest.repos.deleteReleaseAsset({
        owner,
        repo,
        asset_id: assetId
      });
    } catch (error) {
      throw new Error(`Failed to delete release asset: ${error.message}`);
    }
  }

  async getLatestRelease(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.getLatestRelease({
        owner,
        repo
      });

      return {
        id: data.id,
        tagName: data.tag_name,
        name: data.name,
        body: data.body,
        draft: data.draft,
        prerelease: data.prerelease,
        createdAt: data.created_at,
        publishedAt: data.published_at,
        url: data.html_url,
        assets: data.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          size: asset.size,
          downloadCount: asset.download_count,
          downloadUrl: asset.browser_download_url,
          createdAt: asset.created_at
        }))
      };
    } catch (error) {
      if (error.status === 404) {
        return null; // No latest release found
      }
      throw new Error(`Failed to get latest release: ${error.message}`);
    }
  }
}

module.exports = GitHubDeployer;