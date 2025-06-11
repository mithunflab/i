
# AI Creator Platform

A powerful AI-driven platform for content creators to build websites, manage projects, and streamline their creative workflow.

## Features

### 🎯 Creator Dashboard
- **YouTube Website Builder**: Automatically generate stunning websites from YouTube channels
- **Project Management**: Track and manage all your creative projects
- **Real-time Analytics**: Monitor performance and engagement metrics
- **Service Status Indicators**: Visual indicators for connected services

### 🔗 Service Status Indicators

The platform includes real-time status indicators in the top-right corner of the dashboard showing the connection status of four key services:

- **🔴/🟢 YouTube API**: Indicates if YouTube Data API v3 is configured and active
- **🔴/🟢 OpenRouter**: Shows if OpenRouter AI API is connected for content generation
- **🔴/🟢 Netlify**: Displays deployment service connection status
- **🔴/🟢 GitHub**: Shows version control integration status

**Color Coding:**
- 🟢 **Green Circle**: Service is properly configured and active
- 🔴 **Red Circle**: Service is not configured or inactive

These indicators update in real-time when administrators configure API keys and tokens in the developer dashboard.

### 🚀 Key Capabilities

1. **YouTube Integration**
   - Fetch channel data using YouTube Data API v3
   - Extract videos, subscribers, and channel information
   - Generate responsive websites automatically

2. **AI-Powered Generation**
   - OpenRouter integration for content creation
   - Real-time website generation
   - Custom branding and styling

3. **Deployment & Hosting**
   - One-click Netlify deployment
   - Custom domain support
   - SSL certificate management

4. **Developer Tools**
   - Comprehensive admin dashboard
   - API key management
   - Real-time monitoring
   - Audit logging

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Deployment**: Netlify
- **APIs**: YouTube Data API v3, OpenRouter AI
- **UI Components**: shadcn/ui, Lucide React

## Getting Started

1. **Authentication**: Sign up with email or Google OAuth
2. **API Configuration**: Administrator sets up required API keys
3. **Service Status**: Check the status indicators in the dashboard
4. **Create Projects**: Start building with the YouTube Website Builder
5. **Deploy**: One-click deployment to Netlify

## Service Configuration

For administrators, the following services need to be configured:

### YouTube API
- Obtain API key from Google Cloud Console
- Enable YouTube Data API v3
- Configure in Admin Dashboard > YouTube API Settings

### OpenRouter
- Sign up at OpenRouter.ai
- Generate API key
- Configure in Admin Dashboard > API Keys

### Netlify
- Create Netlify account
- Generate deployment token
- Configure in Admin Dashboard > Deployment Settings

### GitHub
- Create GitHub personal access token
- Configure for version control integration
- Set up in Admin Dashboard > GitHub Settings

## Real-time Features

- **Live API Status**: Service indicators update automatically
- **Real-time Collaboration**: Multiple users can work simultaneously
- **Instant Deployments**: See changes reflected immediately
- **Live Analytics**: Real-time performance monitoring

## Security

- Row Level Security (RLS) for data protection
- Encrypted API key storage
- User authentication and authorization
- Audit logging for all actions

## Support

For technical support or feature requests, contact the development team through the platform's support channels.

---

Built with ❤️ for content creators worldwide.
