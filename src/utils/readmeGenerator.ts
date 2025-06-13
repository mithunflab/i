
interface ProjectData {
  title: string;
  description: string;
  channelData?: {
    title: string;
    description: string;
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
  features: string[];
  designPrinciples: string[];
  currentStructure: {
    components: string[];
    styling: Record<string, any>;
    layout: string;
  };
  githubUrl?: string;
  netlifyUrl?: string;
  lastModified: Date;
}

export const generateReadme = (projectData: ProjectData): string => {
  const { title, description, channelData, features, designPrinciples, currentStructure, githubUrl, netlifyUrl } = projectData;
  
  return `# ${title}

${description}

## 🚀 Project Overview

This website was generated using AI technology to create a modern, responsive web experience specifically tailored for ${channelData?.title || 'the content creator'}.

${channelData ? `
## 📺 YouTube Channel Integration

- **Channel**: ${channelData.title}
- **Subscribers**: ${parseInt(channelData.subscriberCount).toLocaleString()}
- **Videos**: ${parseInt(channelData.videoCount).toLocaleString()}
- **Total Views**: ${parseInt(channelData.viewCount).toLocaleString()}
- **Description**: ${channelData.description}

### Channel Branding Integration
- Custom color scheme matching channel identity
- Subscribe buttons and call-to-action elements
- Video showcase and latest content integration
- Channel statistics display
` : ''}

## ✨ Current Features

${features.map(feature => `- ${feature}`).join('\n')}

## 🎨 Design Principles

${designPrinciples.map(principle => `- ${principle}`).join('\n')}

## 🏗️ Website Structure

### Layout: ${currentStructure.layout}

### Components
${currentStructure.components.map(component => `- **${component}**: Core website section`).join('\n')}

### Styling Approach
${currentStructure.styling.colors ? `- **Color Palette**: ${currentStructure.styling.colors.slice(0, 3).join(', ')}` : ''}
- **Responsive Design**: Mobile-first approach
- **Typography**: Professional and readable fonts
- **Animations**: Smooth transitions and hover effects

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with gradients and animations
- **JavaScript**: Interactive elements and smooth scrolling
- **Responsive Design**: Mobile-first approach
- **AI Generated**: Created with advanced AI technology

## 📱 Browser Compatibility

This website is compatible with all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🚀 Deployment

${netlifyUrl ? `**Live Website**: [${netlifyUrl}](${netlifyUrl})` : 'Ready for deployment'}
${githubUrl ? `**Source Code**: [${githubUrl}](${githubUrl})` : ''}

This project is automatically deployed and can be hosted on any static hosting service:
- Netlify ✅
- Vercel
- GitHub Pages
- AWS S3

## 🔄 Version History

- **Last Modified**: ${projectData.lastModified.toLocaleDateString()}
- **Auto-deployed**: Real-time updates to live site
- **Version Control**: Tracked via GitHub integration

## 📝 Modification Guidelines

When making changes to this website:

1. **Preserve Brand Identity**: Maintain ${channelData?.title || 'channel'} branding and color scheme
2. **Component-Based Changes**: Modify specific sections without affecting the overall layout
3. **Mobile Responsiveness**: Ensure all changes work across devices
4. **YouTube Integration**: Keep subscribe buttons and channel elements prominent
5. **Performance**: Maintain fast loading times and smooth animations

### Component Modification Map
${currentStructure.components.map(component => 
  `- **${component}**: Can be modified independently without affecting other sections`
).join('\n')}

## 🎯 Content Strategy

- **Hero Section**: Primary call-to-action and channel branding
- **Video Gallery**: Latest content showcase with YouTube integration
- **Stats Section**: Channel metrics and engagement data
- **Call-to-Actions**: Subscribe buttons and social media links
- **Footer**: Contact information and additional links

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤖 AI-Generated

This website was created using advanced AI technology that analyzed requirements and generated optimized, modern web code automatically. All modifications maintain the original design integrity while adding requested features.

### AI Modification Log
- Component-specific changes preserve existing layout
- Design consistency maintained across updates
- YouTube branding and integration preserved
- Mobile responsiveness automatically maintained

---

**Created with ❤️ using AI Technology**
**Optimized for ${channelData?.title || 'Content Creators'}**
`;
};

export const generateProjectFeatures = (projectIdea: string, channelData?: any, currentCode?: string): string[] => {
  const baseFeatures = [
    'Responsive design for all devices',
    'Modern CSS3 animations and transitions',
    'Smooth scrolling navigation',
    'Professional typography system',
    'SEO-optimized structure',
    'Fast loading performance',
    'Cross-browser compatibility',
    'Mobile-first responsive design'
  ];

  const youtubeFeatures = channelData ? [
    `YouTube channel integration for ${channelData.title}`,
    'Subscriber count display',
    'Latest videos showcase section',
    'Channel branding and color matching',
    'Subscribe call-to-action buttons',
    'Video embed functionality',
    'Channel statistics display'
  ] : [];

  const codeFeatures = currentCode ? [
    'Interactive hover effects',
    'Gradient background styling',
    'Call-to-action buttons',
    'Social media integration',
    'Contact form functionality'
  ] : [];

  return [...baseFeatures, ...youtubeFeatures, ...codeFeatures];
};

export const generateModificationInstructions = (componentType: string, currentStructure: any): string => {
  const instructions = {
    'hero': 'Modify the main header section while preserving the channel title and primary call-to-action',
    'navigation': 'Update navigation menu items while maintaining the responsive mobile menu functionality',
    'video-gallery': 'Modify video display layout while keeping YouTube integration intact',
    'stats': 'Update statistics display while preserving channel metrics integration',
    'footer': 'Modify footer content while maintaining social media and contact links',
    'call-to-action': 'Update button styling and text while preserving click functionality'
  };

  return instructions[componentType] || `Modify this ${componentType} component while preserving existing functionality and design consistency`;
};
