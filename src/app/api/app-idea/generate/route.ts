import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appIdea } = body;

    if (!appIdea) {
      return NextResponse.json(
        { error: 'Please provide an app idea to generate' },
        { status: 400 }
      );
    }

    // Generate a simple, friendly app structure
    const generatedApp = {
      success: true,
      message: "Great! I've created a basic app structure for you:",
      app: {
        name: generateAppName(appIdea.appType.name),
        description: appIdea.description,
        type: appIdea.appType.name,
        platform: appIdea.platform,
        features: appIdea.features,
        files: generateAppFiles(appIdea),
        setup: generateSetupInstructions(appIdea),
        nextSteps: [
          '📱 Download the app files',
          '🎨 Customize the design and colors',
          '⚙️ Add your specific features',
          '🧪 Test on your device',
          '🚀 Publish to app stores'
        ]
      },
      tips: [
        'Start with the main features first',
        'Keep the design simple and clean',
        'Test your app on real devices',
        'Get feedback from potential users',
        'Update your app regularly with improvements'
      ],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(generatedApp);

  } catch (error) {
    console.error('App generation error:', error);
    return NextResponse.json(
      { error: 'I had trouble generating your app. Let me try a simpler approach!' },
      { status: 500 }
    );
  }
}

function generateAppName(appType: string): string {
  const prefixes = ['My', 'Super', 'Go', 'Quick', 'Easy'];
  const suffixes = ['App', 'Pro', 'Plus', 'Hub', 'Mate'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix} ${appType} ${suffix}`;
}

function generateAppFiles(appIdea: any): any[] {
  const files = [
    {
      name: 'README.md',
      content: generateReadme(appIdea),
      type: 'documentation'
    },
    {
      name: 'app.json',
      content: generateAppConfig(appIdea),
      type: 'configuration'
    },
    {
      name: 'package.json',
      content: generatePackageJson(appIdea),
      type: 'configuration'
    },
    {
      name: 'App.js',
      content: generateMainAppFile(appIdea),
      type: 'source'
    },
    {
      name: 'styles.css',
      content: generateStyles(appIdea),
      type: 'stylesheet'
    }
  ];

  // Add feature-specific files
  if (appIdea.features.some((f: any) => f.name === 'User Profiles')) {
    files.push({
      name: 'screens/ProfileScreen.js',
      content: generateProfileScreen(),
      type: 'source'
    });
  }

  if (appIdea.features.some((f: any) => f.name === 'Camera Integration')) {
    files.push({
      name: 'components/CameraComponent.js',
      content: generateCameraComponent(),
      type: 'source'
    });
  }

  return files;
}

function generateReadme(appIdea: any): string {
  return `# ${generateAppName(appIdea.appType.name)}

${appIdea.description}

## Features
${appIdea.features.map((f: any) => `- ${f.icon} ${f.name}: ${f.description}`).join('\n')}

## Getting Started

1. Install dependencies: \`npm install\`
2. Start the app: \`npm start\`
3. Test on your device or simulator

## Requirements
- Node.js 16+
- React Native CLI
- iOS Simulator (for iPhone) or Android Emulator

## Development
- Made with ❤️ using React Native
- Simple and clean codebase
- Easy to customize and extend

Happy coding! 🚀
`;
}

function generateAppConfig(appIdea: any): string {
  return JSON.stringify({
    "name": generateAppName(appIdea.appType.name),
    "displayName": generateAppName(appIdea.appType.name),
    "version": "1.0.0",
    "description": appIdea.description,
    "platform": appIdea.platform.toLowerCase(),
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }, null, 2);
}

function generatePackageJson(appIdea: any): string {
  return JSON.stringify({
    "name": generateAppName(appIdea.appType.name).toLowerCase().replace(/\s+/g, '-'),
    "version": "1.0.0",
    "description": appIdea.description,
    "main": "App.js",
    "scripts": {
      "start": "react-native start",
      "android": "react-native run-android",
      "ios": "react-native run-ios",
      "test": "jest"
    },
    "dependencies": {
      "react": "18.2.0",
      "react-native": "0.72.0",
      "react-native-vector-icons": "^9.2.0"
    },
    "devDependencies": {
      "@babel/core": "^7.20.0",
      "@babel/runtime": "^7.20.0",
      "@react-native/eslint-config": "^0.72.0",
      "@react-native/metro-config": "^0.72.0",
      "@tsconfig/react-native": "^2.0.2",
      "@types/react": "^18.0.24",
      "@types/react-test-renderer": "^18.0.0",
      "babel-jest": "^29.2.1",
      "eslint": "^8.19.0",
      "jest": "^29.2.1",
      "metro-react-native-babel-preset": "0.76.0",
      "prettier": "^2.4.1",
      "react-test-renderer": "18.2.0",
      "typescript": "4.8.4"
    },
    "jest": {
      "preset": "react-native"
    }
  }, null, 2);
}

function generateMainAppFile(appIdea: any): string {
  return `import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>${generateAppName(appIdea.appType.name)}</Text>
          <Text style={styles.subtitle}>${appIdea.description}</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          ${appIdea.features.map((f: any) => `
          <View style={styles.featureItem} key="${f.name}">
            <Text style={styles.featureIcon}>${f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>${f.name}</Text>
              <Text style={styles.featureDesc}>${f.description}</Text>
            </View>
          </View>`).join('')}
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <Text style={styles.actionText}>
            This is your new app! Start by customizing the design and adding your specific features.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  actionSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
`;
}

function generateStyles(appIdea: any): string {
  return `/* Global styles for ${generateAppName(appIdea.appType.name)} */

:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --accent-color: #ec4899;
  --text-color: #1f2937;
  --background-color: #f9fafb;
  --card-background: #ffffff;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
  color: var(--text-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: var(--card-background);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button:hover {
  background: var(--secondary-color);
}

.input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 16px;
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
`;
}

function generateProfileScreen(): string {
  return `import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/100' }} 
          style={styles.avatar} 
        />
        <Text style={styles.userName}>John Doe</Text>
        <Text style={styles.userEmail}>john@example.com</Text>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <Text style={styles.settingItem}>Edit Profile</Text>
        <Text style={styles.settingItem}>Change Password</Text>
        <Text style={styles.settingItem}>Notification Settings</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
`;
}

function generateCameraComponent(): string {
  return `import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'expo-camera';

export default function CameraComponent() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhoto(photo.uri);
    }
  };

  if (hasPermission === null) {
    return <View><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {photo ? (
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => setPhoto(null)}
          >
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
});
`;
}

function generateSetupInstructions(appIdea: any): string {
  return `## Setup Instructions for ${generateAppName(appIdea.appType.name)}

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Start Development Server
\`\`\`bash
npm start
\`\`\`

### 3. Run on Device/Simulator

#### For iOS:
\`\`\`bash
npm run ios
\`\`\`

#### For Android:
\`\`\`bash
npm run android
\`\`\`

### 4. Customize Your App
- Edit \`App.js\` to change the main interface
- Modify \`styles.css\` to update colors and styling
- Add new screens in the \`screens/\` directory
- Create reusable components in \`components/\`

### 5. Test Your App
- Test on real devices when possible
- Check different screen sizes
- Verify all features work correctly

Happy building! 🚀
`;
}