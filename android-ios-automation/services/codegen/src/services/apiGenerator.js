const fs = require("fs-extra");
const path = require("path");
const handlebars = require("handlebars");
const archiver = require("archiver");
const logger = require("../config/logger");

class APIGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates/api");
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Register Handlebars helpers
    handlebars.registerHelper("camelCase", (str) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    handlebars.registerHelper("pascalCase", (str) => {
      return str.replace(/(?:^|-)([a-z])/g, (_, letter) => letter.toUpperCase());
    });

    handlebars.registerHelper("snake_case", (str) => {
      return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
    });

    handlebars.registerHelper("uppercase", (str) => {
      return str.toUpperCase();
    });

    handlebars.registerHelper("lowercase", (str) => {
      return str.toLowerCase();
    });
  }

  async generateAPI(apiConfig) {
    try {
      const {
        projectName,
        apiName,
        endpoints,
        databaseSchema,
        framework = "express", // Default to Express.js
        language = "javascript" // Default to JavaScript
      } = apiConfig;

      logger.info("Starting API generation", { projectName, apiName, framework, language });

      // Create project directory structure
      const projectDir = path.join("/tmp", `api-${Date.now()}-${projectName}`);
      await fs.ensureDir(projectDir);

      if (framework === "express") {
        await this.generateExpressAPI(projectDir, apiConfig);
      } else if (framework === "fastapi") {
        await this.generateFastAPI(projectDir, apiConfig);
      } else {
        throw new Error(`Unsupported framework: ${framework}`);
      }

      // Create ZIP archive
      const zipPath = await this.createZipArchive(projectDir, projectName);

      // Clean up temporary directory
      await fs.remove(projectDir);

      logger.info("API generation completed", { projectName, apiName, framework, zipPath });

      return {
        success: true,
        projectPath: zipPath,
        filesGenerated: await this.countGeneratedFiles(projectDir),
        buildConfig: {
          framework: framework,
          language: language,
          version: framework === "express" ? "4.18" : "0.104"
        }
      };

    } catch (error) {
      logger.error("API generation failed", { error: error.message, apiConfig });
      throw error;
    }
  }

  async generateExpressAPI(projectDir, config) {
    logger.info("Generating Express.js API", { projectName: config.projectName });

    // Generate package.json
    await this.generateExpressPackageJson(projectDir, config);
    
    // Generate app structure
    await this.generateExpressStructure(projectDir, config);
    
    // Generate main app file
    await this.generateExpressApp(projectDir, config);
    
    // Generate routes
    await this.generateExpressRoutes(projectDir, config);
    
    // Generate controllers
    await this.generateExpressControllers(projectDir, config);
    
    // Generate models
    await this.generateExpressModels(projectDir, config);
    
    // Generate middleware
    await this.generateExpressMiddleware(projectDir, config);
    
    // Generate utilities
    await this.generateExpressUtils(projectDir, config);
    
    // Generate configuration
    await this.generateExpressConfig(projectDir, config);
    
    // Generate database setup
    await this.generateExpressDatabase(projectDir, config);
  }

  async generateExpressPackageJson(projectDir, config) {
    const packageJsonTemplate = `{
  "name": "{{projectName}}-api",
  "version": "1.0.0",
  "description": "Express.js API for {{projectName}}",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback",
    "seed": "knex seed:run"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "compression": "^1.7.4",
    "knex": "^3.1.0",
    "pg": "^8.11.3",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.1",
    "node-cron": "^3.0.3",
    "redis": "^4.6.11",
    "socket.io": "^4.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.1.1",
    "@types/jest": "^29.5.8",
    "@types/node": "^20.10.4",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/compression": "^1.7.5",
    "@types/multer": "^1.4.11",
    "@types/node-cron": "^3.0.11"
  },
  "keywords": [
    "express",
    "api",
    "rest",
    "nodejs"
  ],
  "author": "{{author}}",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}`;

    const template = handlebars.compile(packageJsonTemplate);
    const content = template({
      projectName: config.projectName,
      author: config.userRequirements?.author || "Generated"
    });

    await fs.writeFile(path.join(projectDir, "package.json"), content);
  }

  async generateExpressStructure(projectDir, config) {
    const structure = [
      "src",
      "src/controllers",
      "src/models",
      "src/routes",
      "src/middleware",
      "src/utils",
      "src/config",
      "src/services",
      "tests",
      "tests/unit",
      "tests/integration",
      "migrations",
      "seeds",
      "logs",
      "uploads",
      "docs"
    ];

    for (const dir of structure) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  async generateExpressApp(projectDir, config) {
    const appTemplate = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { connectDatabase } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { authMiddleware } = require('./middleware/auth');
const logger = require('./utils/logger');
const routes = require('./routes');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '{{projectName}}-api',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(\`Client \${socket.id} joined room: \${room}\`);
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: \`Route \${req.originalUrl} not found\`
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    server.listen(PORT, () => {
      logger.info(\`{{projectName}} API running on port \${PORT}\`);
      logger.info(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();

module.exports = { app, io, server };`;

    const template = handlebars.compile(appTemplate);
    const content = template({ projectName: config.projectName });

    await fs.writeFile(path.join(projectDir, "src/app.js"), content);
  }

  async generateExpressRoutes(projectDir, config) {
    const routesTemplate = `const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');
const itemController = require('../controllers/itemController');
const authController = require('../controllers/authController');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
router.post('/auth/register', validateRequest('register'), authController.register);
router.post('/auth/login', validateRequest('login'), authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.post('/auth/refresh', authController.refreshToken);

// User routes
router.get('/users', authMiddleware, userController.getAllUsers);
router.get('/users/:id', authMiddleware, userController.getUserById);
router.put('/users/:id', authMiddleware, validateRequest('updateUser'), userController.updateUser);
router.delete('/users/:id', authMiddleware, userController.deleteUser);

// Item routes
router.get('/items', authMiddleware, itemController.getAllItems);
router.get('/items/:id', authMiddleware, itemController.getItemById);
router.post('/items', authMiddleware, validateRequest('createItem'), itemController.createItem);
router.put('/items/:id', authMiddleware, validateRequest('updateItem'), itemController.updateItem);
router.delete('/items/:id', authMiddleware, itemController.deleteItem);

module.exports = router;`;

    await fs.writeFile(path.join(projectDir, "src/routes/index.js"), routesTemplate);
  }

  async generateExpressControllers(projectDir, config) {
    // Auth Controller
    const authControllerTemplate = `const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new AppError('User already exists', 409);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Save refresh token
      await User.saveRefreshToken(user.id, refreshToken);

      logger.info('User registered successfully', { userId: user.id, email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Save refresh token
      await User.saveRefreshToken(user.id, refreshToken);

      logger.info('User logged in successfully', { userId: user.id, email });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await User.removeRefreshToken(refreshToken);
      }

      logger.info('User logged out successfully', { userId: req.user?.id });

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // Check if refresh token exists in database
      const user = await User.findByRefreshToken(refreshToken);
      if (!user) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken
        }
      });

    } catch (error) {
      next(error);
    }
  }

  generateAccessToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = new AuthController();`;

    await fs.writeFile(path.join(projectDir, "src/controllers/authController.js"), authControllerTemplate);

    // User Controller
    const userControllerTemplate = `const User = require('../models/User');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      const users = await User.findAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        search
      });

      const total = await User.count({ search });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user is updating their own profile or is admin
      if (req.user.id !== id && req.user.role !== 'admin') {
        throw new AppError('Unauthorized to update this user', 403);
      }

      const updatedUser = await User.update(id, { name, email });

      logger.info('User updated successfully', { userId: id, updatedBy: req.user.id });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });

    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user is deleting their own account or is admin
      if (req.user.id !== id && req.user.role !== 'admin') {
        throw new AppError('Unauthorized to delete this user', 403);
      }

      await User.delete(id);

      logger.info('User deleted successfully', { userId: id, deletedBy: req.user.id });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();`;

    await fs.writeFile(path.join(projectDir, "src/controllers/userController.js"), userControllerTemplate);

    // Item Controller
    const itemControllerTemplate = `const Item = require('../models/Item');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class ItemController {
  async getAllItems(req, res, next) {
    try {
      const { page = 1, limit = 10, search, category } = req.query;
      const offset = (page - 1) * limit;

      const items = await Item.findAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        category
      });

      const total = await Item.count({ search, category });

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async getItemById(req, res, next) {
    try {
      const { id } = req.params;

      const item = await Item.findById(id);
      if (!item) {
        throw new AppError('Item not found', 404);
      }

      res.json({
        success: true,
        data: { item }
      });

    } catch (error) {
      next(error);
    }
  }

  async createItem(req, res, next) {
    try {
      const { title, description, category, price } = req.body;
      const userId = req.user.id;

      const item = await Item.create({
        title,
        description,
        category,
        price,
        created_by: userId
      });

      logger.info('Item created successfully', { itemId: item.id, userId });

      res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: { item }
      });

    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, category, price } = req.body;

      const item = await Item.findById(id);
      if (!item) {
        throw new AppError('Item not found', 404);
      }

      // Check if user is the owner or admin
      if (item.created_by !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Unauthorized to update this item', 403);
      }

      const updatedItem = await Item.update(id, {
        title,
        description,
        category,
        price
      });

      logger.info('Item updated successfully', { itemId: id, updatedBy: req.user.id });

      res.json({
        success: true,
        message: 'Item updated successfully',
        data: { item: updatedItem }
      });

    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req, res, next) {
    try {
      const { id } = req.params;

      const item = await Item.findById(id);
      if (!item) {
        throw new AppError('Item not found', 404);
      }

      // Check if user is the owner or admin
      if (item.created_by !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Unauthorized to delete this item', 403);
      }

      await Item.delete(id);

      logger.info('Item deleted successfully', { itemId: id, deletedBy: req.user.id });

      res.json({
        success: true,
        message: 'Item deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemController();`;

    await fs.writeFile(path.join(projectDir, "src/controllers/itemController.js"), itemControllerTemplate);
  }

  async generateExpressModels(projectDir, config) {
    // User Model
    const userModelTemplate = `const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, name, role = 'user' } = userData;
    
    const query = \`
      INSERT INTO users (email, password, name, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, email, name, role, created_at
    \`;
    
    const result = await db.query(query, [email, password, name, role]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = \`
      SELECT id, email, name, role, created_at, updated_at
      FROM users
      WHERE id = $1
    \`;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const query = \`
      SELECT id, email, password, name, role, created_at, updated_at
      FROM users
      WHERE email = $1
    \`;
    
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findAll(options = {}) {
    const { limit = 10, offset = 0, search } = options;
    let query = \`
      SELECT id, email, name, role, created_at, updated_at
      FROM users
    \`;
    let params = [];
    let paramIndex = 1;

    if (search) {
      query += \` WHERE email ILIKE $${paramIndex} OR name ILIKE $${paramIndex}\`;
      params.push(\`%\${search}%\`);
      paramIndex++;
    }

    query += \` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}\`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async count(options = {}) {
    let query = 'SELECT COUNT(*) FROM users';
    let params = [];
    let paramIndex = 1;

    if (options.search) {
      query += \` WHERE email ILIKE $${paramIndex} OR name ILIKE $${paramIndex}\`;
      params.push(\`%\${options.search}%\`);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async update(id, userData) {
    const { email, name, role } = userData;
    
    const query = \`
      UPDATE users
      SET email = $1, name = $2, role = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, email, name, role, updated_at
    \`;
    
    const result = await db.query(query, [email, name, role, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    await db.query(query, [id]);
  }

  static async saveRefreshToken(userId, refreshToken) {
    const query = \`
      INSERT INTO user_refresh_tokens (user_id, refresh_token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '7 days')
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    \`;
    
    await db.query(query, [userId, refreshToken]);
  }

  static async removeRefreshToken(refreshToken) {
    const query = 'DELETE FROM user_refresh_tokens WHERE refresh_token = $1';
    await db.query(query, [refreshToken]);
  }

  static async findByRefreshToken(refreshToken) {
    const query = \`
      SELECT u.id, u.email, u.name, u.role
      FROM users u
      JOIN user_refresh_tokens urt ON u.id = urt.user_id
      WHERE urt.refresh_token = $1 AND urt.expires_at > NOW()
    \`;
    
    const result = await db.query(query, [refreshToken]);
    return result.rows[0] || null;
  }
}

module.exports = User;`;

    await fs.writeFile(path.join(projectDir, "src/models/User.js"), userModelTemplate);

    // Item Model
    const itemModelTemplate = `const db = require('../config/database');

class Item {
  static async create(itemData) {
    const { title, description, category, price, created_by } = itemData;
    
    const query = \`
      INSERT INTO items (title, description, category, price, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    \`;
    
    const result = await db.query(query, [title, description, category, price, created_by]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = \`
      SELECT i.*, u.name as created_by_name
      FROM items i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1
    \`;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findAll(options = {}) {
    const { limit = 10, offset = 0, search, category } = options;
    let query = \`
      SELECT i.*, u.name as created_by_name
      FROM items i
      LEFT JOIN users u ON i.created_by = u.id
    \`;
    let params = [];
    let paramIndex = 1;

    const conditions = [];
    
    if (search) {
      conditions.push(\`(i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})\`);
      params.push(\`%\${search}%\`);
      paramIndex++;
    }
    
    if (category) {
      conditions.push(\`i.category = $${paramIndex}\`);
      params.push(category);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += \` WHERE \${conditions.join(' AND ')}\`;
    }

    query += \` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}\`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async count(options = {}) {
    let query = 'SELECT COUNT(*) FROM items';
    let params = [];
    let paramIndex = 1;

    const conditions = [];
    
    if (options.search) {
      conditions.push(\`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})\`);
      params.push(\`%\${options.search}%\`);
      paramIndex++;
    }
    
    if (options.category) {
      conditions.push(\`category = $${paramIndex}\`);
      params.push(options.category);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += \` WHERE \${conditions.join(' AND ')}\`;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async update(id, itemData) {
    const { title, description, category, price } = itemData;
    
    const query = \`
      UPDATE items
      SET title = $1, description = $2, category = $3, price = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    \`;
    
    const result = await db.query(query, [title, description, category, price, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM items WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = Item;`;

    await fs.writeFile(path.join(projectDir, "src/models/Item.js"), itemModelTemplate);
  }

  async generateExpressMiddleware(projectDir, config) {
    // Auth Middleware
    const authMiddlewareTemplate = `const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const accessToken = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('User not found', 401);
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError('Access token expired', 401);
      } else {
        throw new AppError('Invalid access token', 401);
      }
    }

  } catch (error) {
    next(error);
  }
};

// Optional: Admin role middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };`;

    await fs.writeFile(path.join(projectDir, "src/middleware/auth.js"), authMiddlewareTemplate);

    // Error Handler Middleware
    const errorHandlerTemplate = `const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = \`\${statusCode}\`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error('Error occurred:', {
    error: error.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = new AppError(message, 401);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler, AppError };`;

    await fs.writeFile(path.join(projectDir, "src/middleware/errorHandler.js"), errorHandlerTemplate);

    // Request Logger Middleware
    const requestLoggerTemplate = `const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('Response sent', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: \`\${responseTime}ms\`,
      timestamp: new Date().toISOString()
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger };`;

    await fs.writeFile(path.join(projectDir, "src/middleware/requestLogger.js"), requestLoggerTemplate);

    // Validation Middleware
    const validationTemplate = `const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

const validateRequest = (validationType) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return next(new AppError(errorMessages.join(', '), 400));
    }
    
    next();
  };
};

module.exports = { validateRequest };`;

    await fs.writeFile(path.join(projectDir, "src/middleware/validation.js"), validationTemplate);
  }

  async generateExpressUtils(projectDir, config) {
    // Logger Utility
    const loggerTemplate = `const winston = require('winston');
const path = require('path');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = \`\${timestamp} [\${level}]: \${message}\`;
    if (Object.keys(meta).length > 0) {
      msg += \` \${JSON.stringify(meta)}\`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' 
        ? winston.format.json() 
        : consoleFormat
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join('logs', 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = logger;`;

    await fs.writeFile(path.join(projectDir, "src/utils/logger.js"), loggerTemplate);

    // Errors Utility
    const errorsTemplate = `class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = \`\${statusCode}\`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400);
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};`;

    await fs.writeFile(path.join(projectDir, "src/utils/errors.js"), errorsTemplate);
  }

  async generateExpressConfig(projectDir, config) {
    // Database Configuration
    const databaseTemplate = `const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool = null;

const connectDatabase = async () => {
  try {
    const databaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || '{{snake_case projectName}}_api',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 2000, // how long to wait for a connection
    };

    pool = new Pool(databaseConfig);

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connected successfully', {
      host: databaseConfig.host,
      database: databaseConfig.database
    });

    // Create tables if they don't exist
    await createTables();

    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const createTables = async () => {
  const createTablesSQL = \`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- User refresh tokens table
    CREATE TABLE IF NOT EXISTS user_refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      refresh_token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- Items table
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      price DECIMAL(10, 2),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_items_created_by ON items(created_by);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_user_refresh_tokens_token ON user_refresh_tokens(refresh_token);
  \`;

  try {
    await pool.query(createTablesSQL);
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Failed to create database tables:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
};

const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

module.exports = {
  connectDatabase,
  getPool,
  closeDatabase
};`;

    const template = handlebars.compile(databaseTemplate);
    const content = template({
      snake_case_projectName: this.snakeCase(config.projectName)
    });

    await fs.writeFile(path.join(projectDir, "src/config/database.js"), content);

    // Environment Configuration
    const envTemplate = `# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME={{snake_case projectName}}_api
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Logging Configuration
LOG_LEVEL=info

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=`;

    const envTemplateContent = handlebars.compile(envTemplate);
    const envContent = envTemplateContent({
      snake_case_projectName: this.snakeCase(config.projectName)
    });

    await fs.writeFile(path.join(projectDir, ".env.example"), envContent);
  }

  async generateExpressDatabase(projectDir, config) {
    // Knex configuration
    const knexfileTemplate = `require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || '{{snake_case projectName}}_api',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },

  staging: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};`;

    const template = handlebars.compile(knexfileTemplate);
    const content = template({
      snake_case_projectName: this.snakeCase(config.projectName)
    });

    await fs.writeFile(path.join(projectDir, "knexfile.js"), content);
  }

  async generateFastAPI(projectDir, config) {
    logger.info("Generating FastAPI project", { projectName: config.projectName });
    
    // Generate requirements.txt
    await this.generateFastAPIRequirements(projectDir, config);
    
    // Generate main.py
    await this.generateFastAPIMain(projectDir, config);
    
    // Generate models
    await this.generateFastAPIModels(projectDir, config);
    
    // Generate routes
    await this.generateFastAPIRoutes(projectDir, config);
    
    // Generate services
    await this.generateFastAPIServices(projectDir, config);
    
    // Generate config
    await this.generateFastAPIConfig(projectDir, config);
  }

  async generateFastAPIRequirements(projectDir, config) {
    const requirementsTemplate = `fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.13.1
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
redis==5.0.1
httpx==0.25.2
pytest==7.4.3
pytest-asyncio==0.21.1`;

    await fs.writeFile(path.join(projectDir, "requirements.txt"), requirementsTemplate);
  }

  async generateFastAPIMain(projectDir, config) {
    const mainTemplate = `from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn
from app.config import settings
from app.database import engine, Base
from app.routes import auth, users, items
from app.services import auth_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="{{projectName}} API",
    description="FastAPI backend for {{projectName}}",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(items.router, prefix="/api/items", tags=["items"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "{{projectName}}-api",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )`;

    const template = handlebars.compile(mainTemplate);
    const content = template({ projectName: config.projectName });

    await fs.writeFile(path.join(projectDir, "main.py"), content);
  }

  async generateFastAPIModels(projectDir, config) {
    // Create app directory
    await fs.ensureDir(path.join(projectDir, "app"));

    // Database models
    const databaseModelsTemplate = `from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = relationship("Item", back_populates="owner")
    refresh_tokens = relationship("RefreshToken", back_populates="user")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    price = Column(Numeric(10, 2))
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="items")`;

    await fs.writeFile(path.join(projectDir, "app/models.py"), databaseModelsTemplate);

    // Pydantic models
    const pydanticModelsTemplate = `from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Item schemas
class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None

class ItemResponse(ItemBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Response schemas
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class PaginatedResponse(BaseModel):
    success: bool
    data: List[dict]
    pagination: dict`;

    await fs.writeFile(path.join(projectDir, "app/schemas.py"), pydanticModelsTemplate);
  }

  async generateFastAPIRoutes(projectDir, config) {
    // Auth routes
    const authRoutesTemplate = `from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserCreate, LoginRequest, RefreshTokenRequest, Token, StandardResponse
from app.services import auth_service

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=StandardResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = await auth_service.register_user(db, user_data)
        return StandardResponse(
            success=True,
            message="User registered successfully",
            data={"user_id": user.id}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        tokens = await auth_service.login_user(db, login_data.email, login_data.password)
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        tokens = await auth_service.refresh_access_token(db, refresh_data.refresh_token)
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/logout", response_model=StandardResponse)
async def logout(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        await auth_service.logout_user(db, refresh_data.refresh_token)
        return StandardResponse(
            success=True,
            message="Logged out successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))`;

    await fs.writeFile(path.join(projectDir, "app/routes/auth.py"), authRoutesTemplate);

    // Users routes
    const usersRoutesTemplate = `from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import UserResponse, UserUpdate, PaginatedResponse
from app.services import user_service
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    users, total = await user_service.get_users(db, page, limit, search)
    return PaginatedResponse(
        success=True,
        data=users,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if user is updating their own profile or is admin
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    user = await user_service.update_user(db, user_id, user_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if user is deleting their own account or is admin
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    
    success = await user_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "User deleted successfully"}`;

    await fs.writeFile(path.join(projectDir, "app/routes/users.py"), usersRoutesTemplate);

    // Items routes
    const itemsRoutesTemplate = `from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import ItemResponse, ItemCreate, ItemUpdate, PaginatedResponse
from app.services import item_service
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def get_items(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    items, total = await item_service.get_items(db, page, limit, search, category)
    return PaginatedResponse(
        success=True,
        data=items,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = await item_service.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/", response_model=ItemResponse)
async def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = await item_service.create_item(db, item_data, current_user.id)
    return item

@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = await item_service.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user is the owner or admin
    if item.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
    
    updated_item = await item_service.update_item(db, item_id, item_data)
    return updated_item

@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = await item_service.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user is the owner or admin
    if item.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
    success = await item_service.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"success": True, "message": "Item deleted successfully"}`;

    await fs.writeFile(path.join(projectDir, "app/routes/items.py"), itemsRoutesTemplate);

    // Routes init file
    const routesInitTemplate = `from . import auth, users, items`;

    await fs.writeFile(path.join(projectDir, "app/routes/__init__.py"), routesInitTemplate);
  }

  async generateFastAPIServices(projectDir, config) {
    // Auth service
    const authServiceTemplate = `from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models import User, RefreshToken
from app.schemas import UserCreate, Token
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS

    async def register_user(self, db: Session, user_data: UserCreate) -> User:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        hashed_password = self._hash_password(user_data.password)
        
        # Create user
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            name=user_data.name,
            role=user_data.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user

    async def login_user(self, db: Session, email: str, password: str) -> Token:
        # Find user
        user = db.query(User).filter(User.email == email).first()
        if not user or not self._verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        
        if not user.is_active:
            raise ValueError("User account is disabled")
        
        # Generate tokens
        access_token = self._create_access_token(data={"sub": str(user.id)})
        refresh_token = self._create_refresh_token(data={"sub": str(user.id)})
        
        # Save refresh token
        self._save_refresh_token(db, user.id, refresh_token)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )

    async def refresh_access_token(self, db: Session, refresh_token: str) -> Token:
        # Verify refresh token
        try:
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            user_id = payload.get("sub")
            if user_id is None:
                raise ValueError("Invalid refresh token")
        except JWTError:
            raise ValueError("Invalid refresh token")
        
        # Check if refresh token exists and is valid
        db_refresh_token = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token,
            RefreshToken.expires_at > datetime.utcnow()
        ).first()
        
        if not db_refresh_token:
            raise ValueError("Invalid or expired refresh token")
        
        # Generate new access token
        access_token = self._create_access_token(data={"sub": user_id})
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )

    async def logout_user(self, db: Session, refresh_token: str) -> None:
        # Remove refresh token
        db.query(RefreshToken).filter(RefreshToken.token == refresh_token).delete()
        db.commit()

    def _hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def _create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def _create_refresh_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def _save_refresh_token(self, db: Session, user_id: int, refresh_token: str) -> None:
        # Remove existing refresh token
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
        
        # Create new refresh token
        expires_at = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        db_refresh_token = RefreshToken(
            user_id=user_id,
            token=refresh_token,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()

auth_service = AuthService()`;

    await fs.writeFile(path.join(projectDir, "app/services/auth.py"), authServiceTemplate);

    // Services init file
    const servicesInitTemplate = `from . import auth_service, user_service, item_service`;

    await fs.writeFile(path.join(projectDir, "app/services/__init__.py"), servicesInitTemplate);
  }

  async generateFastAPIConfig(projectDir, config) {
    // Settings
    const settingsTemplate = `from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Database settings
    DATABASE_URL: str = "postgresql://postgres:password@localhost/{{snake_case projectName}}_api"
    
    # JWT settings
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"

settings = Settings()`;

    const template = handlebars.compile(settingsTemplate);
    const content = template({
      snake_case_projectName: this.snakeCase(config.projectName)
    });

    await fs.writeFile(path.join(projectDir, "app/config.py"), content);

    // Database
    const databaseTemplate = `from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`;

    await fs.writeFile(path.join(projectDir, "app/database.py"), databaseTemplate);

    // App init file
    const appInitTemplate = `# {{projectName}} API Package`;

    const appInitContent = handlebars.compile(appInitTemplate);
    const appInit = appInitContent({ projectName: config.projectName });

    await fs.writeFile(path.join(projectDir, "app/__init__.py"), appInit);

    // Environment file
    const envTemplate = `# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost/{{snake_case projectName}}_api

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads`;

    const envTemplateContent = handlebars.compile(envTemplate);
    const envContent = envTemplateContent({
      snake_case_projectName: this.snakeCase(config.projectName)
    });

    await fs.writeFile(path.join(projectDir, ".env.example"), envContent);
  }

  async createZipArchive(projectDir, projectName) {
    return new Promise((resolve, reject) => {
      const zipPath = path.join("/tmp", `${projectName}-${Date.now()}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        logger.info("ZIP archive created", { 
          path: zipPath, 
          size: archive.pointer() + " total bytes" 
        });
        resolve(zipPath);
      });

      archive.on("error", (err) => {
        logger.error("ZIP archive creation failed", { error: err.message });
        reject(err);
      });

      archive.pipe(output);
      archive.directory(projectDir, false);
      archive.finalize();
    });
  }

  async countGeneratedFiles(projectDir) {
    let count = 0;
    const countFiles = async (dir) => {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await countFiles(filePath);
        } else {
          count++;
        }
      }
    };
    await countFiles(projectDir);
    return count;
  }

  // Helper methods
  camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  pascalCase(str) {
    return str.replace(/(?:^|-)([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  snakeCase(str) {
    return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
  }
}

module.exports = APIGenerator;