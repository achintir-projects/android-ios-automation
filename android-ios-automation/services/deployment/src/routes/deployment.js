const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const GooglePlayDeployer = require('../services/googlePlayDeployer');
const AppStoreDeployer = require('../services/appStoreDeployer');
const TestFlightDeployer = require('../services/testFlightDeployer');
const FirebaseDeployer = require('../services/firebaseDeployer');
const S3Deployer = require('../services/s3Deployer');
const GitHubDeployer = require('../services/githubDeployer');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger').setupLogger();

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.apk', '.aab', '.ipa', '.zip'];
    const extname = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(extname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only APK, AAB, IPA, and ZIP files are allowed.'));
    }
  }
});

// Deployment status tracking
const deploymentStatus = new Map();

// Get all deployments
router.get('/', async (req, res) => {
  try {
    const redis = getRedisClient();
    const deployments = await redis.get('deployments');
    
    res.json({
      success: true,
      deployments: deployments ? JSON.parse(deployments) : []
    });
  } catch (error) {
    logger.error('Error fetching deployments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployments'
    });
  }
});

// Get deployment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const status = deploymentStatus.get(id);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }

    res.json({
      success: true,
      deployment: status
    });
  } catch (error) {
    logger.error('Error fetching deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployment'
    });
  }
});

// Deploy to Google Play Store
router.post('/google-play', upload.single('appFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const deploymentId = uuidv4();
    const { packageName, track = 'production', releaseNotes } = req.body;

    const deploymentData = {
      id: deploymentId,
      platform: 'android',
      channel: 'google-play',
      status: 'pending',
      filePath: req.file.path,
      fileName: req.file.originalname,
      packageName,
      track,
      releaseNotes,
      createdAt: new Date().toISOString(),
      progress: 0,
      logs: []
    };

    deploymentStatus.set(deploymentId, deploymentData);

    // Start deployment in background
    deployToGooglePlay(deploymentData);

    res.json({
      success: true,
      deploymentId,
      message: 'Deployment started'
    });
  } catch (error) {
    logger.error('Error starting Google Play deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start deployment'
    });
  }
});

// Deploy to Apple App Store
router.post('/app-store', upload.single('appFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const deploymentId = uuidv4();
    const { bundleId, releaseNotes, whatsNew } = req.body;

    const deploymentData = {
      id: deploymentId,
      platform: 'ios',
      channel: 'app-store',
      status: 'pending',
      filePath: req.file.path,
      fileName: req.file.originalname,
      bundleId,
      releaseNotes,
      whatsNew,
      createdAt: new Date().toISOString(),
      progress: 0,
      logs: []
    };

    deploymentStatus.set(deploymentId, deploymentData);

    // Start deployment in background
    deployToAppStore(deploymentData);

    res.json({
      success: true,
      deploymentId,
      message: 'Deployment started'
    });
  } catch (error) {
    logger.error('Error starting App Store deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start deployment'
    });
  }
});

// Deploy to TestFlight
router.post('/testflight', upload.single('appFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const deploymentId = uuidv4();
    const { bundleId, groups = 'Internal Testing' } = req.body;

    const deploymentData = {
      id: deploymentId,
      platform: 'ios',
      channel: 'testflight',
      status: 'pending',
      filePath: req.file.path,
      fileName: req.file.originalname,
      bundleId,
      groups,
      createdAt: new Date().toISOString(),
      progress: 0,
      logs: []
    };

    deploymentStatus.set(deploymentId, deploymentData);

    // Start deployment in background
    deployToTestFlight(deploymentData);

    res.json({
      success: true,
      deploymentId,
      message: 'Deployment started'
    });
  } catch (error) {
    logger.error('Error starting TestFlight deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start deployment'
    });
  }
});

// Deploy to Firebase App Distribution
router.post('/firebase', upload.single('appFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const deploymentId = uuidv4();
    const { appId, releaseNotes, testers = '' } = req.body;

    const deploymentData = {
      id: deploymentId,
      platform: req.file.originalname.endsWith('.apk') ? 'android' : 'ios',
      channel: 'firebase',
      status: 'pending',
      filePath: req.file.path,
      fileName: req.file.originalname,
      appId,
      releaseNotes,
      testers,
      createdAt: new Date().toISOString(),
      progress: 0,
      logs: []
    };

    deploymentStatus.set(deploymentId, deploymentData);

    // Start deployment in background
    deployToFirebase(deploymentData);

    res.json({
      success: true,
      deploymentId,
      message: 'Deployment started'
    });
  } catch (error) {
    logger.error('Error starting Firebase deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start deployment'
    });
  }
});

// Deploy to AWS S3
router.post('/s3', upload.single('appFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const deploymentId = uuidv4();
    const { bucketName, keyPrefix = '' } = req.body;

    const deploymentData = {
      id: deploymentId,
      platform: 'universal',
      channel: 's3',
      status: 'pending',
      filePath: req.file.path,
      fileName: req.file.originalname,
      bucketName,
      keyPrefix,
      createdAt: new Date().toISOString(),
      progress: 0,
      logs: []
    };

    deploymentStatus.set(deploymentId, deploymentData);

    // Start deployment in background
    deployToS3(deploymentData);

    res.json({
      success: true,
      deploymentId,
      message: 'Deployment started'
    });
  } catch (error) {
    logger.error('Error starting S3 deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start deployment'
    });
  }
});

// Deploy to GitHub Releases
router.post('/github', upload.single('appFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const deploymentId = uuidv4();
    const { owner, repo, tagName, releaseName, releaseNotes } = req.body;

    const deploymentData = {
      id: deploymentId,
      platform: 'universal',
      channel: 'github',
      status: 'pending',
      filePath: req.file.path,
      fileName: req.file.originalname,
      owner,
      repo,
      tagName,
      releaseName,
      releaseNotes,
      createdAt: new Date().toISOString(),
      progress: 0,
      logs: []
    };

    deploymentStatus.set(deploymentId, deploymentData);

    // Start deployment in background
    deployToGitHub(deploymentData);

    res.json({
      success: true,
      deploymentId,
      message: 'Deployment started'
    });
  } catch (error) {
    logger.error('Error starting GitHub deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start deployment'
    });
  }
});

// Cancel deployment
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = deploymentStatus.get(id);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }

    if (deployment.status === 'completed' || deployment.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed deployment'
      });
    }

    deployment.status = 'cancelled';
    deployment.logs.push('Deployment cancelled by user');
    deploymentStatus.set(id, deployment);

    res.json({
      success: true,
      message: 'Deployment cancelled'
    });
  } catch (error) {
    logger.error('Error cancelling deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel deployment'
    });
  }
});

// Helper functions for deployment
async function deployToGooglePlay(deploymentData) {
  try {
    const deployer = new GooglePlayDeployer();
    await deployer.deploy(deploymentData);
  } catch (error) {
    logger.error('Google Play deployment failed:', error);
    deploymentData.status = 'failed';
    deploymentData.logs.push(`Deployment failed: ${error.message}`);
    deploymentStatus.set(deploymentData.id, deploymentData);
  }
}

async function deployToAppStore(deploymentData) {
  try {
    const deployer = new AppStoreDeployer();
    await deployer.deploy(deploymentData);
  } catch (error) {
    logger.error('App Store deployment failed:', error);
    deploymentData.status = 'failed';
    deploymentData.logs.push(`Deployment failed: ${error.message}`);
    deploymentStatus.set(deploymentData.id, deploymentData);
  }
}

async function deployToTestFlight(deploymentData) {
  try {
    const deployer = new TestFlightDeployer();
    await deployer.deploy(deploymentData);
  } catch (error) {
    logger.error('TestFlight deployment failed:', error);
    deploymentData.status = 'failed';
    deploymentData.logs.push(`Deployment failed: ${error.message}`);
    deploymentStatus.set(deploymentData.id, deploymentData);
  }
}

async function deployToFirebase(deploymentData) {
  try {
    const deployer = new FirebaseDeployer();
    await deployer.deploy(deploymentData);
  } catch (error) {
    logger.error('Firebase deployment failed:', error);
    deploymentData.status = 'failed';
    deploymentData.logs.push(`Deployment failed: ${error.message}`);
    deploymentStatus.set(deploymentData.id, deploymentData);
  }
}

async function deployToS3(deploymentData) {
  try {
    const deployer = new S3Deployer();
    await deployer.deploy(deploymentData);
  } catch (error) {
    logger.error('S3 deployment failed:', error);
    deploymentData.status = 'failed';
    deploymentData.logs.push(`Deployment failed: ${error.message}`);
    deploymentStatus.set(deploymentData.id, deploymentData);
  }
}

async function deployToGitHub(deploymentData) {
  try {
    const deployer = new GitHubDeployer();
    await deployer.deploy(deploymentData);
  } catch (error) {
    logger.error('GitHub deployment failed:', error);
    deploymentData.status = 'failed';
    deploymentData.logs.push(`Deployment failed: ${error.message}`);
    deploymentStatus.set(deploymentData.id, deploymentData);
  }
}

module.exports = router;