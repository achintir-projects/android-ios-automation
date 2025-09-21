const express = require("express");
const { body, validationResult } = require("express-validator");
const { AppError } = require("../middleware/errorHandler");
const AndroidGenerator = require("../services/androidGenerator");
const iOSGenerator = require("../services/iosGenerator");
const CrossPlatformGenerator = require("../services/crossPlatformGenerator");
const APIGenerator = require("../services/apiGenerator");
const logger = require("../config/logger");

const router = express.Router();
const androidGenerator = new AndroidGenerator();
const iosGenerator = new iOSGenerator();
const crossPlatformGenerator = new CrossPlatformGenerator();
const apiGenerator = new APIGenerator();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array().map(err => err.msg).join(", "), 400));
  }
  next();
};

// Generate Android project
router.post("/android", [
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("packageName").notEmpty().withMessage("Package name is required"),
  body("userRequirements").optional().isObject(),
  body("uiComponents").optional().isArray(),
  body("apiEndpoints").optional().isArray(),
  body("databaseSchema").optional().isObject()
], validateRequest, async (req, res, next) => {
  try {
    const projectConfig = {
      ...req.body,
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"] || `req-${Date.now()}`
    };

    logger.info("Starting Android project generation", projectConfig);

    const result = await androidGenerator.generateProject(projectConfig);

    logger.info("Android project generation completed", {
      requestId: projectConfig.requestId,
      projectName: projectConfig.projectName,
      filesGenerated: result.filesGenerated
    });

    res.json({
      success: true,
      message: "Android project generated successfully",
      data: {
        projectName: projectConfig.projectName,
        platform: "android",
        filesGenerated: result.filesGenerated,
        buildConfig: result.buildConfig,
        downloadUrl: `/api/codegen/download/${result.projectPath.split("/").pop()}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("Android project generation failed", {
      error: error.message,
      requestBody: req.body
    });
    next(error);
  }
});

// Generate iOS project
router.post("/ios", [
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("bundleIdentifier").notEmpty().withMessage("Bundle identifier is required"),
  body("userRequirements").optional().isObject(),
  body("uiComponents").optional().isArray(),
  body("apiEndpoints").optional().isArray(),
  body("databaseSchema").optional().isObject()
], validateRequest, async (req, res, next) => {
  try {
    const projectConfig = {
      ...req.body,
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"] || `req-${Date.now()}`
    };

    logger.info("Starting iOS project generation", projectConfig);

    const result = await iosGenerator.generateProject(projectConfig);

    logger.info("iOS project generation completed", {
      requestId: projectConfig.requestId,
      projectName: projectConfig.projectName,
      filesGenerated: result.filesGenerated
    });

    res.json({
      success: true,
      message: "iOS project generated successfully",
      data: {
        projectName: projectConfig.projectName,
        platform: "ios",
        filesGenerated: result.filesGenerated,
        buildConfig: result.buildConfig,
        downloadUrl: `/api/codegen/download/${result.projectPath.split("/").pop()}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("iOS project generation failed", {
      error: error.message,
      requestBody: req.body
    });
    next(error);
  }
});

// Generate cross-platform project
router.post("/cross-platform", [
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("packageName").optional().isString(),
  body("framework").optional().isIn(["react-native", "flutter"]).withMessage("Framework must be react-native or flutter"),
  body("userRequirements").optional().isObject(),
  body("uiComponents").optional().isArray(),
  body("apiEndpoints").optional().isArray(),
  body("databaseSchema").optional().isObject()
], validateRequest, async (req, res, next) => {
  try {
    const projectConfig = {
      ...req.body,
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"] || `req-${Date.now()}`
    };

    logger.info("Starting cross-platform project generation", projectConfig);

    const result = await crossPlatformGenerator.generateProject(projectConfig);

    logger.info("Cross-platform project generation completed", {
      requestId: projectConfig.requestId,
      projectName: projectConfig.projectName,
      framework: projectConfig.framework,
      filesGenerated: result.filesGenerated
    });

    res.json({
      success: true,
      message: "Cross-platform project generated successfully",
      data: {
        projectName: projectConfig.projectName,
        platform: "cross-platform",
        framework: projectConfig.framework,
        filesGenerated: result.filesGenerated,
        buildConfig: result.buildConfig,
        downloadUrl: `/api/codegen/download/${result.projectPath.split("/").pop()}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("Cross-platform project generation failed", {
      error: error.message,
      requestBody: req.body
    });
    next(error);
  }
});

// Generate API project
router.post("/api", [
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("apiName").optional().isString(),
  body("framework").optional().isIn(["express", "fastapi"]).withMessage("Framework must be express or fastapi"),
  body("language").optional().isIn(["javascript", "python"]).withMessage("Language must be javascript or python"),
  body("endpoints").optional().isArray(),
  body("databaseSchema").optional().isObject()
], validateRequest, async (req, res, next) => {
  try {
    const apiConfig = {
      ...req.body,
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"] || `req-${Date.now()}`
    };

    logger.info("Starting API generation", apiConfig);

    const result = await apiGenerator.generateAPI(apiConfig);

    logger.info("API generation completed", {
      requestId: apiConfig.requestId,
      projectName: apiConfig.projectName,
      framework: apiConfig.framework,
      filesGenerated: result.filesGenerated
    });

    res.json({
      success: true,
      message: "API generated successfully",
      data: {
        projectName: apiConfig.projectName,
        platform: "api",
        framework: apiConfig.framework,
        language: apiConfig.language,
        filesGenerated: result.filesGenerated,
        buildConfig: result.buildConfig,
        downloadUrl: `/api/codegen/download/${result.projectPath.split("/").pop()}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("API generation failed", {
      error: error.message,
      requestBody: req.body
    });
    next(error);
  }
});

// Generate complete project (mobile + API)
router.post("/complete", [
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("mobilePlatform").isIn(["android", "ios", "cross-platform"]).withMessage("Invalid mobile platform"),
  body("apiFramework").optional().isIn(["express", "fastapi"]).withMessage("Invalid API framework"),
  body("userRequirements").optional().isObject(),
  body("uiComponents").optional().isArray(),
  body("apiEndpoints").optional().isArray(),
  body("databaseSchema").optional().isObject()
], validateRequest, async (req, res, next) => {
  try {
    const projectConfig = {
      ...req.body,
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"] || `req-${Date.now()}`
    };

    logger.info("Starting complete project generation", projectConfig);

    const results = [];

    // Generate mobile project
    let mobileResult;
    switch (projectConfig.mobilePlatform) {
      case "android":
        mobileResult = await androidGenerator.generateProject(projectConfig);
        break;
      case "ios":
        mobileResult = await iosGenerator.generateProject(projectConfig);
        break;
      case "cross-platform":
        mobileResult = await crossPlatformGenerator.generateProject(projectConfig);
        break;
    }
    results.push(mobileResult);

    // Generate API project
    const apiConfig = {
      ...projectConfig,
      apiName: `${projectConfig.projectName}-api`,
      framework: projectConfig.apiFramework || "express",
      language: projectConfig.apiFramework === "fastapi" ? "python" : "javascript"
    };
    const apiResult = await apiGenerator.generateAPI(apiConfig);
    results.push(apiResult);

    logger.info("Complete project generation completed", {
      requestId: projectConfig.requestId,
      projectName: projectConfig.projectName,
      mobilePlatform: projectConfig.mobilePlatform,
      apiFramework: apiConfig.framework,
      totalFilesGenerated: results.reduce((sum, r) => sum + r.filesGenerated, 0)
    });

    res.json({
      success: true,
      message: "Complete project generated successfully",
      data: {
        projectName: projectConfig.projectName,
        mobilePlatform: projectConfig.mobilePlatform,
        apiFramework: apiConfig.framework,
        totalFilesGenerated: results.reduce((sum, r) => sum + r.filesGenerated, 0),
        projects: results.map(result => ({
          platform: result.buildConfig.framework || result.buildConfig.platform,
          filesGenerated: result.filesGenerated,
          buildConfig: result.buildConfig,
          downloadUrl: `/api/codegen/download/${result.projectPath.split("/").pop()}`
        })),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("Complete project generation failed", {
      error: error.message,
      requestBody: req.body
    });
    next(error);
  }
});

// Get project templates
router.get("/templates", async (req, res, next) => {
  try {
    const templates = {
      android: [
        {
          id: "android-basic",
          name: "Basic Android App",
          description: "Simple Android application with basic UI components",
          category: "mobile"
        },
        {
          id: "android-api",
          name: "Android with API",
          description: "Android application with REST API integration",
          category: "mobile"
        },
        {
          id: "android-database",
          name: "Android with Database",
          description: "Android application with local database",
          category: "mobile"
        }
      ],
      ios: [
        {
          id: "ios-basic",
          name: "Basic iOS App",
          description: "Simple iOS application with basic UI components",
          category: "mobile"
        },
        {
          id: "ios-api",
          name: "iOS with API",
          description: "iOS application with REST API integration",
          category: "mobile"
        },
        {
          id: "ios-coredata",
          name: "iOS with Core Data",
          description: "iOS application with Core Data persistence",
          category: "mobile"
        }
      ],
      "cross-platform": [
        {
          id: "react-native-basic",
          name: "React Native Basic",
          description: "Basic React Native application",
          category: "cross-platform"
        },
        {
          id: "react-native-redux",
          name: "React Native with Redux",
          description: "React Native application with Redux state management",
          category: "cross-platform"
        },
        {
          id: "flutter-basic",
          name: "Flutter Basic",
          description: "Basic Flutter application",
          category: "cross-platform"
        },
        {
          id: "flutter-getx",
          name: "Flutter with GetX",
          description: "Flutter application with GetX state management",
          category: "cross-platform"
        }
      ],
      api: [
        {
          id: "express-basic",
          name: "Express.js Basic",
          description: "Basic Express.js REST API",
          category: "backend"
        },
        {
          id: "express-auth",
          name: "Express.js with Auth",
          description: "Express.js API with authentication",
          category: "backend"
        },
        {
          id: "fastapi-basic",
          name: "FastAPI Basic",
          description: "Basic FastAPI REST API",
          category: "backend"
        },
        {
          id: "fastapi-auth",
          name: "FastAPI with Auth",
          description: "FastAPI API with authentication",
          category: "backend"
        }
      ]
    };

    res.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("Failed to get templates", { error: error.message });
    next(error);
  }
});

// Get supported platforms and frameworks
router.get("/platforms", async (req, res, next) => {
  try {
    const platforms = {
      mobile: {
        android: {
          name: "Android",
          description: "Native Android application development",
          frameworks: ["native"],
          languages: ["kotlin", "java"],
          buildTools: ["gradle"]
        },
        ios: {
          name: "iOS",
          description: "Native iOS application development",
          frameworks: ["native"],
          languages: ["swift"],
          buildTools: ["xcode"]
        },
        "cross-platform": {
          name: "Cross-Platform",
          description: "Cross-platform mobile development",
          frameworks: ["react-native", "flutter"],
          languages: ["javascript", "typescript", "dart"],
          buildTools: ["npm", "gradle", "xcode"]
        }
      },
      backend: {
        api: {
          name: "REST API",
          description: "RESTful API development",
          frameworks: ["express", "fastapi"],
          languages: ["javascript", "python"],
          databases: ["postgresql", "mysql", "sqlite"]
        }
      }
    };

    res.json({
      success: true,
      data: platforms,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("Failed to get platforms", { error: error.message });
    next(error);
  }
});

// Validate project configuration
router.post("/validate", [
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("platform").isIn(["android", "ios", "cross-platform", "api"]).withMessage("Invalid platform")
], validateRequest, async (req, res, next) => {
  try {
    const { projectName, platform, ...config } = req.body;
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Basic validation
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      validation.isValid = false;
      validation.errors.push("Project name can only contain letters, numbers, hyphens, and underscores");
    }

    if (projectName.length < 3 || projectName.length > 50) {
      validation.isValid = false;
      validation.errors.push("Project name must be between 3 and 50 characters");
    }

    // Platform-specific validation
    switch (platform) {
      case "android":
        if (!config.packageName) {
          validation.errors.push("Package name is required for Android projects");
        } else if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(config.packageName)) {
          validation.errors.push("Invalid package name format");
        }
        break;
      
      case "ios":
        if (!config.bundleIdentifier) {
          validation.errors.push("Bundle identifier is required for iOS projects");
        } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/.test(config.bundleIdentifier)) {
          validation.errors.push("Invalid bundle identifier format");
        }
        break;
      
      case "cross-platform":
        if (config.framework && !["react-native", "flutter"].includes(config.framework)) {
          validation.errors.push("Framework must be react-native or flutter");
        }
        break;
      
      case "api":
        if (config.framework && !["express", "fastapi"].includes(config.framework)) {
          validation.errors.push("Framework must be express or fastapi");
        }
        break;
    }

    // Recommendations
    if (config.databaseSchema && !config.apiEndpoints) {
      validation.recommendations.push("Consider adding API endpoints for database operations");
    }

    if (config.apiEndpoints && !config.databaseSchema) {
      validation.recommendations.push("Consider adding database schema for data persistence");
    }

    logger.info("Project configuration validation completed", {
      projectName,
      platform,
      isValid: validation.isValid,
      errorsCount: validation.errors.length
    });

    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("Project validation failed", { error: error.message });
    next(error);
  }
});

// Get generation status
router.get("/status/:requestId", async (req, res, next) => {
  try {
    const { requestId } = req.params;
    
    // In a real implementation, you would check the status from a database or cache
    // For now, we'll return a mock response
    const status = {
      requestId,
      status: "completed", // pending, running, completed, failed
      progress: 100,
      message: "Project generation completed successfully",
      startTime: new Date(Date.now() - 30000).toISOString(),
      endTime: new Date().toISOString(),
      result: {
        projectName: "example-project",
        platform: "android",
        filesGenerated: 25,
        downloadUrl: `/api/codegen/download/example-project-${Date.now()}.zip`
      }
    };

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("Failed to get generation status", { error: error.message, requestId: req.params.requestId });
    next(error);
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "codegen-service",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    generators: {
      android: "available",
      ios: "available",
      "cross-platform": "available",
      api: "available"
    }
  });
});

module.exports = router;