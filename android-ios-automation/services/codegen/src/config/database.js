const { Pool } = require("pg");
const logger = require("./logger");

let pool = null;

const connectDatabase = async () => {
  try {
    const databaseConfig = {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "codegen_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 2000, // how long to wait for a connection
    };

    pool = new Pool(databaseConfig);

    // Test the connection
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    logger.info("Database connected successfully", {
      host: databaseConfig.host,
      database: databaseConfig.database
    });

    // Create tables if they don't exist
    await createTables();

    return pool;
  } catch (error) {
    logger.error("Database connection failed:", error);
    throw error;
  }
};

const createTables = async () => {
  const createTablesSQL = `
    -- Code generation projects table
    CREATE TABLE IF NOT EXISTS codegen_projects (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      description TEXT,
      platform VARCHAR(50) NOT NULL, -- 'android', 'ios', 'cross-platform'
      user_id VARCHAR(255) NOT NULL,
      requirements JSONB,
      generated_files JSONB,
      build_config JSONB,
      status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(project_name, user_id)
    );

    -- Generated files table
    CREATE TABLE IF NOT EXISTS generated_files (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES codegen_projects(id) ON DELETE CASCADE,
      file_path VARCHAR(500) NOT NULL,
      file_content TEXT,
      file_type VARCHAR(100),
      file_size INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Code templates table
    CREATE TABLE IF NOT EXISTS code_templates (
      id SERIAL PRIMARY KEY,
      template_name VARCHAR(255) NOT NULL,
      template_type VARCHAR(100) NOT NULL, -- 'android', 'ios', 'api', 'database'
      template_content TEXT NOT NULL,
      description TEXT,
      variables JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Build jobs table
    CREATE TABLE IF NOT EXISTS build_jobs (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES codegen_projects(id) ON DELETE CASCADE,
      job_type VARCHAR(50) NOT NULL, -- 'build', 'test', 'deploy'
      status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
      build_config JSONB,
      build_output TEXT,
      build_artifacts JSONB,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_codegen_projects_user_id ON codegen_projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_codegen_projects_status ON codegen_projects(status);
    CREATE INDEX IF NOT EXISTS idx_codegen_projects_platform ON codegen_projects(platform);
    CREATE INDEX IF NOT EXISTS idx_generated_files_project_id ON generated_files(project_id);
    CREATE INDEX IF NOT EXISTS idx_build_jobs_project_id ON build_jobs(project_id);
    CREATE INDEX IF NOT EXISTS idx_build_jobs_status ON build_jobs(status);
  `;

  try {
    await pool.query(createTablesSQL);
    logger.info("Database tables created successfully");
  } catch (error) {
    logger.error("Failed to create database tables:", error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error("Database not connected. Call connectDatabase() first.");
  }
  return pool;
};

const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info("Database connection closed");
  }
};

module.exports = {
  connectDatabase,
  getPool,
  closeDatabase
};