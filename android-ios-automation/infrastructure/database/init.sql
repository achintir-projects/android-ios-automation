-- Create database
CREATE DATABASE IF NOT EXISTS app_automation;

-- Connect to the database
\\c app_automation;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT "user",
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platforms TEXT[] DEFAULT ARRAY["android", "ios"],
    status VARCHAR(50) DEFAULT "draft",
    input_type VARCHAR(50) DEFAULT "text",
    input_data JSONB,
    app_specification JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create builds table
CREATE TABLE IF NOT EXISTS builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    build_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT "pending",
    build_number INTEGER,
    version VARCHAR(50),
    commit_hash VARCHAR(255),
    build_log TEXT,
    artifact_url TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT "pending",
    deployment_url TEXT,
    store_url TEXT,
    deployment_log TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    test_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT "pending",
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    test_report JSONB,
    coverage_percentage DECIMAL(5,2),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    sentiment VARCHAR(50),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT "pending",
    processed_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create monitoring_metrics table
CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    unit VARCHAR(20),
    tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_builds_project_id ON builds(project_id);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
CREATE INDEX IF NOT EXISTS idx_deployments_build_id ON deployments(build_id);
CREATE INDEX IF NOT EXISTS idx_test_results_build_id ON test_results(build_id);
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_project_id ON monitoring_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language "plpgsql";

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
    "admin@appautomation.com",
    "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZP6", -- bcrypt hash of "admin123"
    "Admin",
    "User",
    "admin"
) ON CONFLICT (email) DO NOTHING;

-- Create default project for testing
INSERT INTO projects (user_id, name, description, platforms, status, input_type, input_data)
SELECT 
    id,
    "Demo Project",
    "A sample project to demonstrate the platform capabilities",
    ARRAY["android", "ios"],
    "draft",
    "text",
    {description: Create a simple todo list application with user authentication}
FROM users WHERE email = "admin@appautomation.com" AND role = "admin"
ON CONFLICT DO NOTHING;
