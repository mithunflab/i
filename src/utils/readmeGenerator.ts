
export const generateReadme = (options: {
  title: string;
  description: string;
  channelData?: any;
  features: string[];
  designPrinciples: string[];
  currentStructure: any;
  githubUrl?: string;
  netlifyUrl?: string;
  lastModified: Date;
}) => {
  const {
    title,
    description,
    channelData,
    features,
    designPrinciples,
    currentStructure,
    githubUrl,
    netlifyUrl,
    lastModified
  } = options;

  return `# ${title}

${description}

## 🎥 YouTube Channel Integration

${channelData ? `
- **Channel**: ${channelData.title}
- **Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
- **Videos**: ${parseInt(channelData.videoCount || '0').toLocaleString()}
- **Views**: ${parseInt(channelData.viewCount || '0').toLocaleString()}
` : 'No channel data available'}

## ✨ Features

${features.map(feature => `- ${feature}`).join('\n')}

## 🎨 Design Principles

${designPrinciples.map(principle => `- ${principle}`).join('\n')}

## 🏗️ Architecture

- **Components**: ${currentStructure.components?.join(', ') || 'Modern web components'}
- **Styling**: ${currentStructure.styling?.colors?.join(', ') || 'Responsive CSS'}
- **Layout**: ${currentStructure.layout || 'Modern responsive design'}

## 🚀 Deployment

${netlifyUrl ? `- **Live Site**: [${netlifyUrl}](${netlifyUrl})` : ''}
${githubUrl ? `- **Source Code**: [${githubUrl}](${githubUrl})` : ''}

## 🔧 AI-Generated

This website was generated using AI technology with real-time YouTube data integration.

**Last Modified**: ${lastModified.toISOString()}

---

Built with ❤️ using AI Website Builder
`;
};

export const generateProjectFeatures = (
  projectIdea: string,
  channelData: any,
  generatedCode: string
): string[] => {
  const features = [
    'Responsive design for all devices',
    'Modern CSS3 animations and transitions',
    'YouTube channel integration',
    'Real-time data display',
    'SEO-optimized structure',
    'Fast loading performance'
  ];

  if (channelData) {
    features.push(
      `Integration with ${channelData.title}`,
      'Live subscriber count display',
      'Latest videos showcase'
    );
  }

  if (generatedCode?.includes('grid')) {
    features.push('CSS Grid layout system');
  }

  if (generatedCode?.includes('flex')) {
    features.push('Flexbox-based components');
  }

  if (generatedCode?.includes('@media')) {
    features.push('Mobile-first responsive design');
  }

  return features;
};
