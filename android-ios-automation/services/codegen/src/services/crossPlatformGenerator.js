const fs = require("fs-extra");
const path = require("path");
const handlebars = require("handlebars");
const archiver = require("archiver");
const logger = require("../config/logger");

class CrossPlatformGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates/cross-platform");
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

  async generateProject(projectConfig) {
    try {
      const {
        projectName,
        packageName,
        userRequirements,
        uiComponents,
        apiEndpoints,
        databaseSchema,
        framework = "react-native" // Default to React Native
      } = projectConfig;

      logger.info("Starting cross-platform project generation", { projectName, framework });

      // Create project directory structure
      const projectDir = path.join("/tmp", `cross-platform-${Date.now()}-${projectName}`);
      await fs.ensureDir(projectDir);

      if (framework === "react-native") {
        await this.generateReactNativeProject(projectDir, projectConfig);
      } else if (framework === "flutter") {
        await this.generateFlutterProject(projectDir, projectConfig);
      } else {
        throw new Error(`Unsupported framework: ${framework}`);
      }

      // Create ZIP archive
      const zipPath = await this.createZipArchive(projectDir, projectName);

      // Clean up temporary directory
      await fs.remove(projectDir);

      logger.info("Cross-platform project generation completed", { projectName, framework, zipPath });

      return {
        success: true,
        projectPath: zipPath,
        filesGenerated: await this.countGeneratedFiles(projectDir),
        buildConfig: {
          framework: framework,
          version: framework === "react-native" ? "0.72" : "3.16"
        }
      };

    } catch (error) {
      logger.error("Cross-platform project generation failed", { error: error.message, projectConfig });
      throw error;
    }
  }

  async generateReactNativeProject(projectDir, config) {
    logger.info("Generating React Native project", { projectName: config.projectName });

    // Generate package.json
    await this.generateRNPackageJson(projectDir, config);
    
    // Generate app structure
    await this.generateRNAppStructure(projectDir, config);
    
    // Generate main app files
    await this.generateRNAppFiles(projectDir, config);
    
    // Generate components
    await this.generateRNComponents(projectDir, config);
    
    // Generate screens
    await this.generateRNScreens(projectDir, config);
    
    // Generate navigation
    await this.generateRNNavigation(projectDir, config);
    
    // Generate services
    await this.generateRNServices(projectDir, config);
    
    // Generate store/state management
    await this.generateRNStore(projectDir, config);
    
    // Generate assets
    await this.generateRNAssets(projectDir, config);
    
    // Generate configuration files
    await this.generateRNConfig(projectDir, config);
  }

  async generateRNPackageJson(projectDir, config) {
    const packageJsonTemplate = `{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "cd ios && xcodebuild -workspace {{projectName}}.xcworkspace -scheme {{projectName}} -configuration Release -archivePath {{projectName}}.xcarchive archive"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "axios": "^1.6.2",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.0",
    "react-native-vector-icons": "^10.0.3",
    "react-native-async-storage": "^1.21.0",
    "react-native-sqlite-storage": "^6.0.1",
    "react-native-device-info": "^10.9.0",
    "react-native-toast-message": "^2.1.7"
  },
  "devDependencies": {
    "@babel/core": "^7.23.5",
    "@babel/preset-env": "^7.23.5",
    "@babel/runtime": "^7.23.5",
    "@react-native/eslint-config": "^0.73.1",
    "@react-native/metro-config": "^0.73.3",
    "@react-native/typescript-config": "^0.73.1",
    "@types/react": "^18.2.45",
    "@types/react-test-renderer": "^18.2.0",
    "babel-jest": "^29.7.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "metro-react-native-babel-preset": "0.77.0",
    "prettier": "^3.1.1",
    "react-test-renderer": "18.2.0",
    "typescript": "5.3.3"
  },
  "jest": {
    "preset": "react-native"
  },
  "keywords": [
    "react-native",
    "cross-platform",
    "mobile"
  ],
  "author": "{{author}}",
  "license": "MIT"
}`;

    const template = handlebars.compile(packageJsonTemplate);
    const content = template({
      projectName: config.projectName,
      description: config.userRequirements?.description || "Cross-platform mobile application",
      author: config.userRequirements?.author || "Generated"
    });

    await fs.writeFile(path.join(projectDir, "package.json"), content);
  }

  async generateRNAppStructure(projectDir, config) {
    const structure = [
      "android",
      "android/app",
      "android/app/src",
      "android/app/src/main",
      "android/app/src/main/java",
      "android/app/src/main/res",
      "ios",
      "ios/{{projectName}}",
      "ios/{{projectName}}.xcodeproj",
      "src",
      "src/components",
      "src/screens",
      "src/navigation",
      "src/services",
      "src/store",
      "src/utils",
      "src/assets",
      "src/assets/images",
      "src/assets/fonts",
      "__tests__"
    ];

    for (const dir of structure) {
      const template = handlebars.compile(dir);
      const pathStr = template(config);
      await fs.ensureDir(path.join(projectDir, pathStr));
    }
  }

  async generateRNAppFiles(projectDir, config) {
    // index.js
    const indexJsTemplate = `import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);`;

    await fs.writeFile(path.join(projectDir, "index.js"), indexJsTemplate);

    // app.json
    const appJsonTemplate = `{
  "name": "{{projectName}}",
  "displayName": "{{projectName}}",
  "version": "1.0.0",
  "versionCode": 1
}`;

    const template = handlebars.compile(appJsonTemplate);
    const content = template({ projectName: config.projectName });
    await fs.writeFile(path.join(projectDir, "app.json"), content);

    // App.tsx
    const appTsxTemplate = `import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { PersistGate } from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/utils/theme';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
          <Toast />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;`;

    await fs.writeFile(path.join(projectDir, "src/App.tsx"), appTsxTemplate);
  }

  async generateRNComponents(projectDir, config) {
    // Button component
    const buttonTemplate = `import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style = {},
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Button;`;

    await fs.writeFile(path.join(projectDir, "src/components/Button.tsx"), buttonTemplate);

    // Card component
    const cardTemplate = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: object;
}

const Card: React.FC<CardProps> = ({ title, children, style = {} }) => {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
});

export default Card;`;

    await fs.writeFile(path.join(projectDir, "src/components/Card.tsx"), cardTemplate);
  }

  async generateRNScreens(projectDir, config) {
    // Home Screen
    const homeScreenTemplate = `import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchItems } from '../store/slices/itemsSlice';
import Card from '../components/Card';
import Button from '../components/Button';
import { theme } from '../utils/theme';

interface Item {
  id: string;
  title: string;
  description: string;
}

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state: any) => state.items);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchItems());
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Item }) => (
    <Card title={item.title}>
      <Text style={styles.description}>{item.description}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to {{projectName}}</Text>
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
            <Button
              title="Refresh"
              onPress={handleRefresh}
              variant="outline"
              style={styles.refreshButton}
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginVertical: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  refreshButton: {
    minWidth: 120,
  },
});

export default HomeScreen;`;

    const template = handlebars.compile(homeScreenTemplate);
    const content = template({ projectName: config.projectName });
    await fs.writeFile(path.join(projectDir, "src/screens/HomeScreen.tsx"), content);

    // Profile Screen
    const profileScreenTemplate = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Card from '../components/Card';
import Button from '../components/Button';
import { theme } from '../utils/theme';

const ProfileScreen: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);

  const handleLogout = () => {
    // Implement logout logic
  };

  return (
    <View style={styles.container}>
      <Card title="Profile">
        <View style={styles.profileInfo}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user?.name || 'Not set'}</Text>
          
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'Not set'}</Text>
        </View>
      </Card>

      <Card title="Settings">
        <Button
          title="Edit Profile"
          onPress={() => {}}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Change Password"
          onPress={() => {}}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  profileInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
    fontWeight: '500',
  },
  button: {
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    marginTop: 8,
  },
});

export default ProfileScreen;`;

    await fs.writeFile(path.join(projectDir, "src/screens/ProfileScreen.tsx"), profileScreenTemplate);
  }

  async generateRNNavigation(projectDir, config) {
    // App Navigator
    const appNavigatorTemplate = `import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ title: 'Home' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default AppNavigator;`;

    await fs.writeFile(path.join(projectDir, "src/navigation/AppNavigator.tsx"), appNavigatorTemplate);
  }

  async generateRNServices(projectDir, config) {
    // API Service
    const apiServiceTemplate = `import axios from 'react-native-axios';
import { Platform } from 'react-native';

interface ApiResponse<T> {
  data: T;
  message: string;
  status: boolean;
}

class ApiService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = 'https://api.example.com';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': \`\${Platform.OS} {{projectName}}/1.0.0\`,
    };
  }

  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await axios.get(\`\${this.baseURL}\${endpoint}\`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await axios.post(\`\${this.baseURL}\${endpoint}\`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await axios.put(\`\${this.baseURL}\${endpoint}\`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await axios.delete(\`\${this.baseURL}\${endpoint}\`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: any) {
    console.error('API Error:', error.response?.data || error.message);
    // You can add global error handling here
  }
}

export const apiService = new ApiService();
export default ApiService;`;

    const template = handlebars.compile(apiServiceTemplate);
    const content = template({ projectName: config.projectName });
    await fs.writeFile(path.join(projectDir, "src/services/ApiService.ts"), content);

    // Storage Service
    const storageServiceTemplate = `import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async storeData(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  }

  async getData<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      throw error;
    }
  }

  async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      throw error;
    }
  }
}

export const storageService = StorageService.getInstance();
export default StorageService;`;

    await fs.writeFile(path.join(projectDir, "src/services/StorageService.ts"), storageServiceTemplate);
  }

  async generateRNStore(projectDir, config) {
    // Store configuration
    const storeTemplate = `import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authSlice from './slices/authSlice';
import itemsSlice from './slices/itemsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth reducer
};

const persistedAuthReducer = persistReducer(persistConfig, authSlice);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    items: itemsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`;

    await fs.writeFile(path.join(projectDir, "src/store/index.ts"), storeTemplate);

    // Auth slice
    const authSliceTemplate = `import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;`;

    await fs.writeFile(path.join(projectDir, "src/store/slices/authSlice.ts"), authSliceTemplate);

    // Items slice
    const itemsSliceTemplate = `import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Item {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemsState {
  items: Item[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const initialState: ItemsState = {
  items: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    fetchItemsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchItemsSuccess: (state, action: PayloadAction<{ items: Item[]; hasMore: boolean }>) => {
      state.loading = false;
      state.items = [...state.items, ...action.payload.items];
      state.hasMore = action.payload.hasMore;
      state.page += 1;
      state.error = null;
    },
    fetchItemsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addItem: (state, action: PayloadAction<Item>) => {
      state.items.unshift(action.payload);
    },
    updateItem: (state, action: PayloadAction<Item>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearItems: (state) => {
      state.items = [];
      state.page = 1;
      state.hasMore = true;
    },
  },
});

export const fetchItems = () => async (dispatch: any) => {
  try {
    dispatch(fetchItemsStart());
    // Replace with actual API call
    const response = await fetch('https://api.example.com/items');
    const data = await response.json();
    dispatch(fetchItemsSuccess({ items: data.items, hasMore: data.hasMore }));
  } catch (error) {
    dispatch(fetchItemsFailure(error.message));
  }
};

export const {
  fetchItemsStart,
  fetchItemsSuccess,
  fetchItemsFailure,
  addItem,
  updateItem,
  removeItem,
  clearItems,
} = itemsSlice.actions;

export default itemsSlice.reducer;`;

    await fs.writeFile(path.join(projectDir, "src/store/slices/itemsSlice.ts"), itemsSliceTemplate);
  }

  async generateRNAssets(projectDir, config) {
    // Theme configuration
    const themeTemplate = `import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#5AC8FA',
  background: '#F2F2F7',
  white: '#FFFFFF',
  black: '#000000',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  width,
  height,
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.typography.md,
  },
});

export default theme;`;

    await fs.writeFile(path.join(projectDir, "src/utils/theme.ts"), themeTemplate);
  }

  async generateRNConfig(projectDir, config) {
    // Metro configuration
    const metroConfigTemplate = `const { getDefaultConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      ...defaultConfig.resolver.extraNodeModules,
    },
  },
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};`;

    await fs.writeFile(path.join(projectDir, "metro.config.js"), metroConfigTemplate);

    // TypeScript configuration
    const tsConfigTemplate = `{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/services/*": ["src/services/*"],
      "@/store/*": ["src/store/*"],
      "@/utils/*": ["src/utils/*"],
      "@/assets/*": ["src/assets/*"]
    }
  }
}`;

    await fs.writeFile(path.join(projectDir, "tsconfig.json"), tsConfigTemplate);
  }

  async generateFlutterProject(projectDir, config) {
    logger.info("Generating Flutter project", { projectName: config.projectName });
    
    // Generate pubspec.yaml
    await this.generateFlutterPubspec(projectDir, config);
    
    // Generate lib structure
    await this.generateFlutterLib(projectDir, config);
    
    // Generate main.dart
    await this.generateFlutterMain(projectDir, config);
    
    // Generate widgets
    await this.generateFlutterWidgets(projectDir, config);
    
    // Generate services
    await this.generateFlutterServices(projectDir, config);
    
    // Generate models
    await this.generateFlutterModels(projectDir, config);
  }

  async generateFlutterPubspec(projectDir, config) {
    const pubspecTemplate = `name: {{snake_case projectName}}
description: {{description}}
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  get: ^4.6.5
  http: ^1.1.0
  shared_preferences: ^2.2.2
  path_provider: ^2.1.1
  sqflite: ^2.3.0
  flutter_secure_storage: ^9.0.0
  intl: ^0.18.1
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.1
  flutter_screenutil: ^5.9.0
  fluttertoast: ^8.2.4
  device_info_plus: ^9.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/fonts/
  
  fonts:
    - family: Roboto
      fonts:
        - asset: assets/fonts/Roboto-Regular.ttf
        - asset: assets/fonts/Roboto-Bold.ttf
          weight: 700`;

    const template = handlebars.compile(pubspecTemplate);
    const content = template({
      projectName: config.projectName,
      description: config.userRequirements?.description || "Cross-platform mobile application"
    });

    await fs.writeFile(path.join(projectDir, "pubspec.yaml"), content);
  }

  async generateFlutterLib(projectDir, config) {
    const structure = [
      "lib",
      "lib/config",
      "lib/models",
      "lib/screens",
      "lib/widgets",
      "lib/services",
      "lib/utils",
      "assets",
      "assets/images",
      "assets/fonts"
    ];

    for (const dir of structure) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  async generateFlutterMain(projectDir, config) {
    const mainTemplate = `import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:{{snake_case projectName}}/config/routes.dart';
import 'package:{{snake_case projectName}}/config/theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: '{{projectName}}',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      initialRoute: Routes.home,
      getPages: AppPages.routes,
      defaultTransition: Transition.cupertino,
      debugShowCheckedModeBanner: false,
    );
  }
}`;

    const template = handlebars.compile(mainTemplate);
    const content = template({
      projectName: config.projectName,
      snake_case_projectName: this.snakeCase(config.projectName)
    });

    await fs.writeFile(path.join(projectDir, "lib/main.dart"), content);
  }

  async generateFlutterWidgets(projectDir, config) {
    // Custom Button widget
    const buttonTemplate = `import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:{{snake_case projectName}}/config/theme.dart';

enum ButtonVariant { primary, secondary, outline }

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final ButtonVariant variant;
  final bool isLoading;
  final bool disabled;
  final double? width;
  final double? height;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.variant = ButtonVariant.primary,
    this.isLoading = false,
    this.disabled = false,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height ?? 50.h,
      child: ElevatedButton(
        onPressed: disabled || isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _getBackgroundColor(),
          foregroundColor: _getTextColor(),
          side: variant == ButtonVariant.outline
              ? BorderSide(color: AppColors.primary)
              : null,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.r),
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 20.w,
                height: 20.w,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(_getTextColor()),
                ),
              )
            : Text(
                text,
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  Color _getBackgroundColor() {
    switch (variant) {
      case ButtonVariant.secondary:
        return AppColors.secondary;
      case ButtonVariant.outline:
        return Colors.transparent;
      default:
        return AppColors.primary;
    }
  }

  Color _getTextColor() {
    return variant == ButtonVariant.outline ? AppColors.primary : Colors.white;
  }
}`;

    const template = handlebars.compile(buttonTemplate);
    const content = template({
      snake_case_projectName: this.snakeCase(config.projectName)
    });

    await fs.writeFile(path.join(projectDir, "lib/widgets/custom_button.dart"), content);
  }

  async generateFlutterServices(projectDir, config) {
    // API Service
    const apiServiceTemplate = `import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService extends GetxService {
  final String baseUrl = 'https://api.example.com';
  
  Future<Map<String, dynamic>> get(String endpoint, {Map<String, dynamic>? params}) async {
    try {
      final uri = Uri.parse('\$baseUrl\$endpoint').replace(queryParameters: params);
      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load data: \${response.statusCode}');
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('\$baseUrl\$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode(data),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to post data: \${response.statusCode}');
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await http.put(
        Uri.parse('\$baseUrl\$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode(data),
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to update data: \${response.statusCode}');
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> delete(String endpoint) async {
    try {
      final response = await http.delete(
        Uri.parse('\$baseUrl\$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );
      
      if (response.statusCode == 200 || response.statusCode == 204) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to delete data: \${response.statusCode}');
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
      rethrow;
    }
  }
}`;

    await fs.writeFile(path.join(projectDir, "lib/services/api_service.dart"), apiServiceTemplate);
  }

  async generateFlutterModels(projectDir, config) {
    // User model
    const userModelTemplate = `class User {
  final String id;
  final String name;
  final String email;
  final String? avatar;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.avatar,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      avatar: json['avatar'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'avatar': avatar,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? avatar,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}`;

    await fs.writeFile(path.join(projectDir, "lib/models/user.dart"), userModelTemplate);
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

module.exports = CrossPlatformGenerator;