const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

// EXPLICIT env loading — CWD-independent, monorepo-safe.
// getDefaultConfig's built-in @expo/env auto-loading relies on process.cwd(),
// which is unreliable when Gradle spawns the Metro bundler from a different
// working directory (e.g. apps/mobile/android). This guarantees .env is
// always read from the correct path regardless of how bundling was triggered.
require('dotenv').config({ path: path.resolve(projectRoot, '.env') });

console.log('METRO CONFIG: projectRoot =', projectRoot);
console.log('METRO CONFIG: workspaceRoot =', workspaceRoot);
console.log('METRO CONFIG: EXPO_PUBLIC_API_BASE_URL loaded =', !!process.env.EXPO_PUBLIC_API_BASE_URL);
console.log('METRO CONFIG: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY loaded =', !!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const config = getDefaultConfig(projectRoot);

// SVG Transformer configuration
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  blockList: [
    /[/\\]android[/\\]/,
    /[/\\]ios[/\\]/,
    /[/\\]\.cxx[/\\]/,
  ],
};

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Explicitly map packages that might fail to resolve in a monorepo
config.resolver.extraNodeModules = {
  'expo-camera': path.resolve(workspaceRoot, 'node_modules/expo-camera'),
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
  'react-dom': path.resolve(workspaceRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'expo-font': path.resolve(workspaceRoot, 'node_modules/expo-font'),
  'expo-asset': path.resolve(workspaceRoot, 'node_modules/expo-asset'),
};

// 4. Force Metro to resolve React and other core packages from the workspace root node_modules
const corePackages = ['react', 'react-dom', 'react-native', 'react-native-web', 'expo', '@expo/metro-runtime', 'react-native-worklets', 'react-native-reanimated'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // For web, let Expo handle react-native -> react-native-web aliasing
  if (platform === 'web' && (moduleName === 'react-native' || moduleName.startsWith('react-native/'))) {
    return context.resolveRequest(context, moduleName, platform);
  }
  const pkgName = corePackages.find(pkg => moduleName === pkg || moduleName.startsWith(`${pkg}/`));
  if (pkgName) {
    try {
      return context.resolveRequest(
        context,
        path.resolve(workspaceRoot, 'node_modules', moduleName),
        platform
      );
    } catch (e) {
      // fallback
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
// config.resolver.disableHierarchicalLookup = true;

// 4. Ensure ttf and other assets are correctly handled
config.resolver.assetExts.push('ttf');

module.exports = config;
