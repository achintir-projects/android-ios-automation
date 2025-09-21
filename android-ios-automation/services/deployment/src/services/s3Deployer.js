const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../config/logger').setupLogger();

class S3Deployer {
  constructor() {
    this.s3 = null;
    this.bucketName = null;
  }

  async initialize() {
    try {
      // Configure AWS SDK
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });

      this.s3 = new AWS.S3();
      
      logger.info('AWS S3 initialized successfully');
    } catch (error) {
      logger.error('AWS S3 initialization failed:', error);
      throw new Error('Failed to initialize AWS S3');
    }
  }

  async deploy(deploymentData) {
    try {
      await this.initialize();
      
      deploymentData.status = 'uploading';
      deploymentData.progress = 10;
      deploymentData.logs.push('Starting AWS S3 deployment...');

      const { bucketName, filePath, keyPrefix = '' } = deploymentData;

      // Validate bucket name
      if (!bucketName) {
        throw new Error('S3 bucket name is required');
      }

      this.bucketName = bucketName;

      deploymentData.logs.push(`Deploying to S3 bucket: ${bucketName}`);
      deploymentData.progress = 20;

      // Check if bucket exists
      const bucketExists = await this.checkBucketExists(bucketName);
      
      if (!bucketExists) {
        deploymentData.logs.push(`Bucket ${bucketName} does not exist, creating...`);
        await this.createBucket(bucketName);
        deploymentData.logs.push('Bucket created successfully');
      }

      deploymentData.progress = 30;

      // Read the app file
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      
      // Generate unique key for the file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);
      const key = keyPrefix ? `${keyPrefix}/${timestamp}-${fileHash}-${fileName}` : `${timestamp}-${fileHash}-${fileName}`;

      deploymentData.logs.push(`Uploading file to S3: ${key}`);
      deploymentData.progress = 40;

      // Upload the file
      const uploadResult = await this.uploadFile(key, fileBuffer, fileName);

      deploymentData.logs.push('File uploaded successfully');
      deploymentData.progress = 60;

      // Set appropriate permissions
      await this.setFilePermissions(key);

      deploymentData.logs.push('File permissions set');
      deploymentData.progress = 70;

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(key);

      deploymentData.logs.push(`Download URL generated: ${downloadUrl}`);
      deploymentData.progress = 80;

      // Create metadata file
      await this.createMetadataFile(key, {
        fileName,
        fileSize: fileBuffer.length,
        uploadTime: new Date().toISOString(),
        downloadUrl,
        platform: this.getPlatform(fileName)
      });

      deploymentData.status = 'completed';
      deploymentData.progress = 100;
      deploymentData.logs.push('AWS S3 deployment completed successfully!');
      deploymentData.completedAt = new Date().toISOString();
      deploymentData.downloadUrl = downloadUrl;

      logger.info(`S3 deployment completed for file ${fileName}`);

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
      logger.error('S3 deployment failed:', error);
      throw error;
    }
  }

  async checkBucketExists(bucketName) {
    try {
      await this.s3.headBucket({ Bucket: bucketName }).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async createBucket(bucketName) {
    try {
      const params = {
        Bucket: bucketName
      };

      // For us-east-1, we don't need LocationConstraint
      if (process.env.AWS_REGION !== 'us-east-1') {
        params.CreateBucketConfiguration = {
          LocationConstraint: process.env.AWS_REGION
        };
      }

      await this.s3.createBucket(params).promise();
      
      // Set bucket policy for public read access
      await this.setBucketPolicy(bucketName);
      
      // Enable versioning
      await this.s3.putBucketVersioning({
        Bucket: bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }).promise();
    } catch (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }

  async setBucketPolicy(bucketName) {
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucketName}/*`
          }
        ]
      };

      await this.s3.putBucketPolicy({
        Bucket: bucketName,
        Policy: JSON.stringify(policy)
      }).promise();
    } catch (error) {
      throw new Error(`Failed to set bucket policy: ${error.message}`);
    }
  }

  async uploadFile(key, fileBuffer, fileName) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: this.getContentType(fileName),
        Metadata: {
          'original-filename': fileName,
          'upload-timestamp': new Date().toISOString(),
          'platform': this.getPlatform(fileName)
        }
      };

      const result = await this.s3.upload(params).promise();
      return result;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async setFilePermissions(key) {
    try {
      await this.s3.putObjectAcl({
        Bucket: this.bucketName,
        Key: key,
        ACL: 'public-read'
      }).promise();
    } catch (error) {
      throw new Error(`Failed to set file permissions: ${error.message}`);
    }
  }

  async generateDownloadUrl(key) {
    try {
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } catch (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  async createMetadataFile(key, metadata) {
    try {
      const metadataKey = `${key}.metadata.json`;
      const metadataContent = JSON.stringify(metadata, null, 2);

      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: metadataKey,
        Body: metadataContent,
        ContentType: 'application/json',
        ACL: 'public-read'
      }).promise();
    } catch (error) {
      throw new Error(`Failed to create metadata file: ${error.message}`);
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

  getPlatform(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    
    if (ext === '.apk') {
      return 'android';
    } else if (ext === '.ipa') {
      return 'ios';
    } else {
      return 'universal';
    }
  }

  async listFiles(bucketName, prefix = '') {
    try {
      const params = {
        Bucket: bucketName,
        Prefix: prefix
      };

      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${item.Key}`
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async deleteFile(bucketName, key) {
    try {
      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: key
      }).promise();
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileInfo(bucketName, key) {
    try {
      const result = await this.s3.headObject({
        Bucket: bucketName,
        Key: key
      }).promise();

      return {
        key,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        metadata: result.Metadata,
        url: `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}

module.exports = S3Deployer;