
interface ProjectData {
  title: string;
  description: string;
  channelData?: {
    title: string;
    description: string;
    subscriberCount: string;
    videoCount: string;
  };
  features: string[];
}

export const generateReadme = (projectData: ProjectData): string => {
  const { title, description, channelData, features } = projectData;
  
  return `# ${title}

${description}

## 🚀 Project Overview

This website was generated using AI technology to create a modern, responsive web experience.

${channelData ? `
## 📺 YouTube Channel Integration

- **Channel**: ${channelData.title}
- **Subscribers**: ${parseInt(channelData.subscriberCount).toLocaleString()}
- **Videos**: ${parseInt(channelData.videoCount).toLocaleString()}
- **Description**: ${channelData.description}
` : ''}

## ✨ Features

${features.map(feature => `- ${feature}`).join('\n')}

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with gradients and animations
- **JavaScript**: Interactive elements and smooth scrolling
- **Responsive Design**: Mobile-first approach
- **AI Generated**: Created with advanced AI technology

## 🎨 Design Features

- Modern gradient backgrounds
- Smooth animations and transitions
- Mobile-responsive layout
- Professional typography
- Call-to-action buttons
- Interactive elements

## 📱 Browser Compatibility

This website is compatible with all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🚀 Deployment

This project is automatically deployed and can be hosted on any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any web server

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤖 Generated with AI

This website was created using advanced AI technology that analyzed requirements and generated optimized, modern web code automatically.

---

**Created with ❤️ using AI Technology**
`;
};

export const generateProjectFeatures = (projectIdea: string, channelData?: any): string[] => {
  const baseFeatures = [
    'Responsive design for all devices',
    'Modern CSS3 animations',
    'Smooth scrolling navigation',
    'Professional typography',
    'SEO-optimized structure',
    'Fast loading performance',
    'Cross-browser compatibility'
  ];

  const youtubeFeatures = channelData ? [
    'YouTube channel integration',
    'Subscriber count display',
    'Video showcase section',
    'Channel branding colors',
    'Subscribe call-to-action buttons'
  ] : [];

  return [...baseFeatures, ...youtubeFeatures];
};
