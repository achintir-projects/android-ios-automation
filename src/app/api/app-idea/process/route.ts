import { NextRequest, NextResponse } from 'next/server';

// Simple, friendly app type detection
const appTypes = [
  { name: 'Fitness App', keywords: ['fitness', 'workout', 'exercise', 'health', 'gym', 'tracking'] },
  { name: 'Social App', keywords: ['social', 'friends', 'chat', 'share', 'connect', 'community'] },
  { name: 'Shopping App', keywords: ['shopping', 'store', 'buy', 'sell', 'products', 'cart'] },
  { name: 'Education App', keywords: ['learn', 'study', 'course', 'education', 'school', 'teach'] },
  { name: 'Productivity App', keywords: ['productivity', 'task', 'todo', 'organize', 'planner', 'schedule'] },
  { name: 'Entertainment App', keywords: ['game', 'music', 'video', 'fun', 'entertainment', 'media'] },
  { name: 'Business App', keywords: ['business', 'work', 'professional', 'company', 'office'] },
  { name: 'Travel App', keywords: ['travel', 'trip', 'hotel', 'flight', 'booking', 'vacation'] }
];

// Simple feature detection
const commonFeatures = [
  { name: 'User Profiles', keywords: ['profile', 'account', 'user', 'login', 'signup'] },
  { name: 'Social Sharing', keywords: ['share', 'social', 'post', 'friends', 'community'] },
  { name: 'Notifications', keywords: ['notification', 'alert', 'reminder', 'push'] },
  { name: 'Camera Integration', keywords: ['camera', 'photo', 'picture', 'scan', 'capture'] },
  { name: 'Maps & Location', keywords: ['map', 'location', 'gps', 'direction', 'place'] },
  { name: 'Payment System', keywords: ['payment', 'buy', 'purchase', 'money', 'checkout'] },
  { name: 'Data Sync', keywords: ['sync', 'cloud', 'backup', 'save', 'storage'] },
  { name: 'Search Function', keywords: ['search', 'find', 'filter', 'browse'] }
];

// Simple platform detection
const platforms = [
  { name: 'iPhone', keywords: ['iphone', 'ios', 'apple'] },
  { name: 'Android', keywords: ['android', 'google'] },
  { name: 'Both', keywords: ['both', 'cross-platform', 'mobile'] }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Please describe your app idea' },
        { status: 400 }
      );
    }

    // Simple, friendly processing
    const lowerDesc = description.toLowerCase();
    
    // Detect app type
    const detectedAppType = detectAppType(lowerDesc);
    
    // Detect features
    const detectedFeatures = detectFeatures(lowerDesc);
    
    // Detect platform
    const detectedPlatform = detectPlatform(lowerDesc);
    
    // Generate simple, friendly response
    const friendlyResponse = {
      success: true,
      message: "I understand your app idea! Here's what I found:",
      appIdea: {
        description: description,
        appType: detectedAppType,
        features: detectedFeatures,
        platform: detectedPlatform,
        complexity: calculateComplexity(detectedFeatures),
        estimatedTime: estimateTime(detectedFeatures),
        nextSteps: generateNextSteps(detectedAppType, detectedFeatures)
      },
      suggestions: generateSuggestions(detectedAppType, detectedFeatures),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(friendlyResponse);

  } catch (error) {
    console.error('App idea processing error:', error);
    return NextResponse.json(
      { error: 'I had trouble understanding your idea. Could you try describing it differently?' },
      { status: 500 }
    );
  }
}

function detectAppType(description: string) {
  let bestMatch = { name: 'Custom App', confidence: 0.3 };
  
  for (const appType of appTypes) {
    const matchCount = appType.keywords.filter(keyword => 
      description.includes(keyword)
    ).length;
    
    const confidence = Math.min(0.9, 0.3 + (matchCount * 0.15));
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { name: appType.name, confidence };
    }
  }
  
  return bestMatch;
}

function detectFeatures(description: string) {
  const detected = [];
  
  for (const feature of commonFeatures) {
    if (feature.keywords.some(keyword => description.includes(keyword))) {
      detected.push({
        name: feature.name,
        description: generateFeatureDescription(feature.name),
        icon: getFeatureIcon(feature.name)
      });
    }
  }
  
  // Always include some basic features
  if (detected.length === 0) {
    detected.push(
      { name: 'User Interface', description: 'Clean and intuitive design', icon: '🎨' },
      { name: 'Basic Functionality', description: 'Core features based on your idea', icon: '⚙️' }
    );
  }
  
  return detected;
}

function detectPlatform(description: string) {
  for (const platform of platforms) {
    if (platform.keywords.some(keyword => description.includes(keyword))) {
      return platform.name;
    }
  }
  return 'Mobile App';
}

function calculateComplexity(features: any[]): 'Simple' | 'Medium' | 'Complex' {
  if (features.length <= 2) return 'Simple';
  if (features.length <= 4) return 'Medium';
  return 'Complex';
}

function estimateTime(features: any[]): string {
  const baseWeeks = 2;
  const featureWeeks = features.length * 1.5;
  const totalWeeks = baseWeeks + featureWeeks;
  
  if (totalWeeks <= 3) return '2-3 weeks';
  if (totalWeeks <= 6) return '1-2 months';
  if (totalWeeks <= 12) return '2-3 months';
  return '3+ months';
}

function generateNextSteps(appType: any, features: any[]): string[] {
  const steps = [
    '✨ Design the app interface',
    '📱 Create basic functionality',
    '🎨 Add visual design and branding',
    '🧪 Test the app thoroughly',
    '🚀 Launch to app stores'
  ];
  
  // Add specific steps based on features
  if (features.some(f => f.name === 'User Profiles')) {
    steps.splice(1, 0, '👤 Build user account system');
  }
  
  if (features.some(f => f.name === 'Payment System')) {
    steps.splice(2, 0, '💳 Integrate payment processing');
  }
  
  return steps.slice(0, 5);
}

function generateSuggestions(appType: any, features: any[]): string[] {
  const suggestions = [];
  
  // App type specific suggestions
  if (appType.name === 'Fitness App') {
    suggestions.push('Consider adding workout tracking and progress charts');
  } else if (appType.name === 'Social App') {
    suggestions.push('Think about privacy settings and content moderation');
  } else if (appType.name === 'Shopping App') {
    suggestions.push('Include product search and filtering options');
  }
  
  // Feature based suggestions
  if (features.some(f => f.name === 'Camera Integration')) {
    suggestions.push('Add photo editing features');
  }
  
  if (features.some(f => f.name === 'Maps & Location')) {
    suggestions.push('Consider offline map capabilities');
  }
  
  // General suggestions
  if (suggestions.length === 0) {
    suggestions.push('Start with the core features first');
    suggestions.push('Get user feedback early and often');
  }
  
  return suggestions.slice(0, 3);
}

function generateFeatureDescription(featureName: string): string {
  const descriptions: { [key: string]: string } = {
    'User Profiles': 'Let users create personal accounts with custom settings',
    'Social Sharing': 'Allow users to share content with friends and social media',
    'Notifications': 'Send timely alerts and updates to users',
    'Camera Integration': 'Capture photos and videos within the app',
    'Maps & Location': 'Show locations, directions, and nearby places',
    'Payment System': 'Handle secure transactions and purchases',
    'Data Sync': 'Keep data backed up and synced across devices',
    'Search Function': 'Help users find what they need quickly',
    'User Interface': 'Beautiful and easy-to-use design',
    'Basic Functionality': 'Essential features to make your app work'
  };
  
  return descriptions[featureName] || 'Useful feature for your app';
}

function getFeatureIcon(featureName: string): string {
  const icons: { [key: string]: string } = {
    'User Profiles': '👤',
    'Social Sharing': '📤',
    'Notifications': '🔔',
    'Camera Integration': '📷',
    'Maps & Location': '🗺️',
    'Payment System': '💳',
    'Data Sync': '☁️',
    'Search Function': '🔍',
    'User Interface': '🎨',
    'Basic Functionality': '⚙️'
  };
  
  return icons[featureName] || '✨';
}