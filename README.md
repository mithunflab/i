
# AI Website Builder - Real-time Code Generation Platform

A professional AI-powered website builder that uses OpenRouter API for real-time code generation, with automatic GitHub repository creation and Netlify deployment.

## 🚀 Features

- **Real-time AI Code Generation** using OpenRouter API
- **Instant GitHub Integration** with automatic repository creation
- **Live Netlify Deployment** with real-time status updates
- **YouTube Channel Integration** for branded websites
- **Professional UI/UX** with modern design patterns
- **Comprehensive Analytics** and usage tracking
- **Admin Dashboard** for API key and user management

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Real-time Chat Interface** with AI code generation
- **Live Preview** of generated websites
- **Deployment Status Tracking** with real-time updates
- **User Dashboard** with project management
- **Admin Panel** for system management

### Backend (Supabase)
- **Edge Functions** for AI integration
- **Real-time Database** with comprehensive schema
- **Row Level Security (RLS)** for data protection
- **API Usage Tracking** and cost monitoring
- **Automated Deployment Pipeline**

## 📊 Database Schema

### Core Tables

#### `profiles`
User profile management with role-based access control.
```sql
- id (uuid, primary key)
- email (text, not null)
- full_name (text)
- role (text, default: 'user') -- 'admin', 'user'
- avatar_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `projects`
AI-generated website projects with deployment tracking.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- name (text, not null)
- description (text)
- youtube_url (text)
- channel_data (jsonb) -- YouTube channel information
- source_code (text) -- Generated HTML/CSS/JS
- github_url (text) -- Repository URL
- netlify_url (text) -- Live website URL
- status (text, default: 'active')
- created_at (timestamp)
- updated_at (timestamp)
```

### API Key Management Tables

#### `openrouter_api_keys`
OpenRouter API keys for AI code generation.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- name (text, not null)
- api_key (text, not null)
- credits_limit (numeric, default: 100)
- credits_used (numeric, default: 0)
- requests_count (integer, default: 0)
- is_active (boolean, default: true)
- last_used_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `github_api_keys`
GitHub API tokens for repository management.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- name (text, not null)
- api_token (text, not null)
- rate_limit_limit (integer, default: 5000)
- rate_limit_used (integer, default: 0)
- is_active (boolean, default: true)
- last_used_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `netlify_api_keys`
Netlify API tokens for deployment management.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- name (text, not null)
- api_token (text, not null)
- deployments_limit (integer, default: 300)
- deployments_count (integer, default: 0)
- is_active (boolean, default: true)
- last_used_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `youtube_api_keys`
YouTube API keys for channel data retrieval.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- name (text, not null)
- api_key (text, not null)
- quota_limit (integer, default: 10000)
- quota_used (integer, default: 0)
- is_active (boolean, default: true)
- last_used_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### Monitoring & Analytics Tables

#### `api_usage_logs`
Comprehensive API usage tracking and cost monitoring.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- provider (text, not null) -- 'openrouter', 'github', 'netlify', 'youtube'
- model (text) -- AI model used (for OpenRouter)
- tokens_used (integer, default: 0)
- cost_usd (numeric, default: 0)
- response_time_ms (integer, default: 0)
- status (text, default: 'success') -- 'success', 'error'
- error_message (text)
- request_data (jsonb) -- Request details
- response_data (jsonb) -- Response details
- created_at (timestamp)
```

#### `project_verification_requests`
Project verification system for quality control.
```sql
- id (uuid, primary key)
- project_id (uuid, foreign key to projects)
- user_id (uuid, foreign key to profiles)
- request_message (text)
- status (text, default: 'pending') -- 'pending', 'approved', 'rejected'
- admin_notes (text)
- reviewed_by (uuid, foreign key to profiles)
- reviewed_at (timestamp)
- requested_at (timestamp, default: now())
```

### Additional System Tables

#### `model_pricing`
AI model pricing information for cost calculation.
```sql
- id (uuid, primary key)
- provider (text, not null)
- model (text, not null)
- input_cost_per_token (numeric, default: 0)
- output_cost_per_token (numeric, default: 0)
- is_active (boolean, default: true)
- plan_tier (text, default: 'free')
- created_at (timestamp)
- updated_at (timestamp)
```

#### `audit_logs`
System audit trail for security and monitoring.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- action (text, not null)
- resource_type (text, not null)
- resource_id (text)
- old_values (jsonb)
- new_values (jsonb)
- ip_address (inet)
- user_agent (text)
- created_at (timestamp)
```

## 🔒 Row Level Security (RLS) Policies

### User Data Protection
All user-specific tables implement RLS to ensure data isolation:

```sql
-- Example: Projects table RLS
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);
```

### Admin Access Control
Admin users have elevated permissions for system management:

```sql
-- Example: Admin access to all data
CREATE POLICY "Admins can access all records" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### API Key Security
API keys are protected with strict access controls:

```sql
-- Users can only access their own API keys
CREATE POLICY "Users own API keys" ON openrouter_api_keys
    FOR ALL USING (auth.uid() = user_id);
```

## 🔧 Supabase Functions

### Core Functions

#### `handle_new_user()`
Automatically creates user profiles when new users sign up.
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE 
            WHEN NEW.email IN ('admin@example.com') THEN 'admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `get_current_user_role()`
Returns the current user's role for authorization checks.
```sql
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

#### `update_updated_at_column()`
Automatically updates the `updated_at` timestamp on record changes.
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Edge Functions

#### `/chat` Function
Real-time AI code generation using OpenRouter API.

**Features:**
- Fetches API keys from database
- Generates dynamic websites based on user requests
- Tracks API usage and costs
- Handles errors gracefully with fallbacks
- Supports different website themes and styles

**Request Format:**
```json
{
    "message": "Create a modern gaming website",
    "projectId": "uuid",
    "channelData": { ... },
    "chatHistory": [ ... ],
    "generateCode": true
}
```

**Response Format:**
```json
{
    "reply": "AI response message",
    "feature": "professional-website",
    "generatedCode": "<html>...</html>",
    "codeDescription": "Professional gaming website"
}
```

## 🚀 Deployment Pipeline

### 1. AI Code Generation
- User submits request through chat interface
- System calls OpenRouter API using database-stored keys
- AI generates custom HTML/CSS/JavaScript code
- Code is validated and processed

### 2. GitHub Integration
- Automatically creates or updates GitHub repository
- Commits generated code with descriptive messages
- Manages repository settings and permissions
- Tracks Git operations in usage logs

### 3. Netlify Deployment
- Deploys website to Netlify using API tokens
- Configures custom domains and SSL
- Monitors deployment status
- Provides live website URLs

### 4. Real-time Updates
- WebSocket-like updates for deployment progress
- Live preview of generated code
- Real-time status indicators
- Instant notifications for completion

## 🎯 API Integration Strategy

### OpenRouter API
- **Purpose**: AI code generation
- **Models**: GPT-4o-mini, GPT-4o, Claude-3-Sonnet
- **Features**: Real-time code generation, cost tracking
- **Security**: Keys stored in database, usage monitoring

### GitHub API
- **Purpose**: Repository management
- **Features**: Auto-commit, branch management, file operations
- **Rate Limiting**: 5000 requests/hour tracking
- **Security**: Personal access tokens, scope-limited

### Netlify API
- **Purpose**: Website deployment
- **Features**: Auto-deploy, custom domains, SSL
- **Limits**: 300 deployments/month tracking
- **Security**: API tokens, site-specific access

### YouTube API
- **Purpose**: Channel data retrieval
- **Features**: Channel stats, video information
- **Quota**: 10,000 units/day tracking
- **Security**: API keys with restricted scope

## 📈 Analytics & Monitoring

### Usage Tracking
- API call counts and costs
- Response times and error rates
- User activity patterns
- Resource utilization metrics

### Cost Management
- Real-time cost calculation
- Budget alerts and limits
- Usage optimization suggestions
- Historical cost analysis

### Performance Monitoring
- System health checks
- Database performance metrics
- API response times
- Error rate monitoring

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Supabase CLI
- Git

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd ai-website-builder

# Install dependencies
npm install

# Start development server
npm run dev

# Deploy Supabase functions
supabase functions deploy
```

## 🛡️ Security Considerations

### Data Protection
- All API keys encrypted in database
- RLS policies enforce data isolation
- Audit logs track all system changes
- Regular security updates and patches

### Access Control
- Role-based permissions (admin/user)
- API rate limiting and quota management
- Session management and timeout
- IP-based access restrictions

### Monitoring
- Real-time security alerts
- Failed authentication tracking
- Suspicious activity detection
- Compliance reporting

## 📞 Support & Documentation

### API Documentation
- Detailed endpoint documentation
- Code examples and tutorials
- Integration guides
- Troubleshooting resources

### User Guides
- Getting started tutorial
- Feature documentation
- Best practices guide
- FAQ and common issues

### Developer Resources
- API reference
- SDK documentation
- Webhook setup guide
- Custom integration examples

---

**Built with ❤️ using React, TypeScript, Supabase, and AI**

*This platform demonstrates the power of AI-driven development with real-time code generation, automated deployment, and comprehensive monitoring.*
