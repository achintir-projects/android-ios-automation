const fs = require("fs-extra");
const path = require("path");
const handlebars = require("handlebars");
const archiver = require("archiver");
const logger = require("../config/logger");

class iOSGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates/ios");
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
  }

  async generateProject(projectConfig) {
    try {
      const {
        projectName,
        bundleIdentifier,
        userRequirements,
        uiComponents,
        apiEndpoints,
        databaseSchema
      } = projectConfig;

      logger.info("Starting iOS project generation", { projectName, bundleIdentifier });

      // Create project directory structure
      const projectDir = path.join("/tmp", `ios-${Date.now()}-${projectName}`);
      await fs.ensureDir(projectDir);

      // Generate iOS project structure
      await this.generateProjectStructure(projectDir, projectConfig);
      
      // Generate Xcode project file
      await this.generateXcodeProject(projectDir, projectConfig);
      
      // Generate Info.plist
      await this.generateInfoPlist(projectDir, projectConfig);
      
      // Generate Swift source files
      await this.generateSourceFiles(projectDir, projectConfig);
      
      // Generate Storyboard files
      await this.generateStoryboards(projectDir, projectConfig);
      
      // Generate data models
      await this.generateDataModels(projectDir, projectConfig);
      
      // Generate API services
      await this.generateApiServices(projectDir, projectConfig);
      
      // Generate Core Data stack
      await this.generateCoreData(projectDir, projectConfig);
      
      // Generate assets
      await this.generateAssets(projectDir, projectConfig);

      // Create ZIP archive
      const zipPath = await this.createZipArchive(projectDir, projectName);

      // Clean up temporary directory
      await fs.remove(projectDir);

      logger.info("iOS project generation completed", { projectName, zipPath });

      return {
        success: true,
        projectPath: zipPath,
        filesGenerated: await this.countGeneratedFiles(projectDir),
        buildConfig: {
          xcodeVersion: "15.0",
          deploymentTarget: "13.0",
          swiftVersion: "5.9"
        }
      };

    } catch (error) {
      logger.error("iOS project generation failed", { error: error.message, projectConfig });
      throw error;
    }
  }

  async generateProjectStructure(projectDir, config) {
    const structure = [
      "{{projectName}}.xcodeproj",
      "{{projectName}}",
      "{{projectName}}/Assets.xcassets",
      "{{projectName}}/Assets.xcassets/AppIcon.appiconset",
      "{{projectName}}/Assets.xcassets/LaunchImage.launchimage",
      "{{projectName}}/Assets.xcassets/Contents.json",
      "{{projectName}}/Preview Content",
      "{{projectName}}/Core Data",
      "{{projectName}}/Models",
      "{{projectName}}/Views",
      "{{projectName}}/ViewModels",
      "{{projectName}}/Services",
      "{{projectName}}/Utils",
      "{{projectName}}/Resources"
    ];

    for (const dir of structure) {
      const template = handlebars.compile(dir);
      const pathStr = template(config);
      await fs.ensureDir(path.join(projectDir, pathStr));
    }
  }

  async generateXcodeProject(projectDir, config) {
    const pbxprojTemplate = `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {

/* Begin PBXBuildFile section */
		{{#each sourceFiles}}
		{{identifier}} /* {{name}} in Sources */ = {isa = PBXBuildFile; fileRef = {{fileRef}} /* {{name}} */; };
		{{/each}}
		{{#each resourceFiles}}
		{{identifier}} /* {{name}} in Resources */ = {isa = PBXBuildFile; fileRef = {{fileRef}} /* {{name}} */; };
		{{/each}}
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
		{{projectIdentifier}} /* {{projectName}}.xcodeproj */ = {isa = PBXFileReference; lastKnownFileType = "wrapper.pb-project"; name = "{{projectName}}.xcodeproj"; path = "{{projectName}}.xcodeproj"; sourceTree = "<group>"; };
		{{appIdentifier}} /* {{projectName}}.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = "{{projectName}}.app"; sourceTree = BUILT_PRODUCTS_DIR; };
		{{#each sourceFiles}}
		{{fileRef}} /* {{name}} */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = "{{name}}"; sourceTree = "<group>"; };
		{{/each}}
		{{#each resourceFiles}}
		{{fileRef}} /* {{name}} */ = {isa = PBXFileReference; lastKnownFileType = {{fileType}}; path = "{{name}}"; sourceTree = "<group>"; };
		{{/each}}
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		{{frameworksPhaseIdentifier}} /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		{{mainGroupIdentifier}} = {
			isa = PBXGroup;
			children = (
				{{appGroupIdentifier}},
				{{frameworksGroupIdentifier}},
				{{productsGroupIdentifier}},
			);
			sourceTree = "<group>";
		};
		{{appGroupIdentifier}} = {
			isa = PBXGroup;
			children = (
				{{appDelegateIdentifier}},
				{{sceneDelegateIdentifier}},
				{{contentViewControllerIdentifier}},
				{{assetsGroupIdentifier}},
				{{previewContentGroupIdentifier}},
				{{coreDataGroupIdentifier}},
			);
			path = "{{projectName}}";
			sourceTree = "<group>";
		};
		{{frameworksGroupIdentifier}} = {
			isa = PBXGroup;
			children = (
			);
			name = Frameworks;
			sourceTree = "<group>";
		};
		{{productsGroupIdentifier}} = {
			isa = PBXGroup;
			children = (
				{{appIdentifier}},
			);
			name = Products;
			sourceTree = "<group>";
		};
		{{assetsGroupIdentifier}} = {
			isa = PBXGroup;
			children = (
				{{appIconIdentifier}},
				{{launchImageIdentifier}},
			);
			name = Assets;
			sourceTree = "<group>";
		};
		{{previewContentGroupIdentifier}} = {
			isa = PBXGroup;
			children = (
			);
			name = "Preview Content";
			sourceTree = "<group>";
		};
		{{coreDataGroupIdentifier}} = {
			isa = PBXGroup;
			children = (
			);
			name = "Core Data";
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		{{targetIdentifier}} /* {{projectName}} */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = {{buildConfigListIdentifier}};
			buildPhases = (
				{{sourcesPhaseIdentifier}},
				{{frameworksPhaseIdentifier}},
				{{resourcesPhaseIdentifier}},
			);
			buildRules = (
			);
			dependencies = (
			);
			name = "{{projectName}}";
			productName = "{{projectName}}";
			productReference = {{appIdentifier}};
			productType = "com.apple.product-type.application";
		};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		{{projectIdentifier}} /* Project object */ = {
			isa = PBXProject;
			attributes = {
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1500;
				LastUpgradeCheck = 1500;
				TargetAttributes = {
					{{targetIdentifier}} = {
						CreatedOnToolsVersion = 15.0;
					};
				};
			};
			buildConfigurationList = {{projectConfigListIdentifier}};
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = {{mainGroupIdentifier}};
			productRefGroup = {{productsGroupIdentifier}};
			projectDirPath = "";
			projectRoot = "";
			targets = (
				{{targetIdentifier}},
			);
		};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		{{resourcesPhaseIdentifier}} /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		{{sourcesPhaseIdentifier}} /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		{{debugConfigIdentifier}} /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 13.0;
				LOCALIZATION_PREFERS_STRING_CATALOGS = YES;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				MTL_FAST_MATH = YES;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG $(inherited)";
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			};
			name = Debug;
		};
		{{releaseConfigIdentifier}} /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 13.0;
				LOCALIZATION_PREFERS_STRING_CATALOGS = YES;
				MTL_ENABLE_DEBUG_INFO = NO;
				MTL_FAST_MATH = YES;
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				VALIDATE_PRODUCT = YES;
			};
			name = Release;
		};
		{{debugTargetConfigIdentifier}} /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_ASSET_PATHS = "{{projectName}}/Preview Content";
				ENABLE_PREVIEWS = YES;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;
				INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "{{bundleIdentifier}}";
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			};
			name = Debug;
		};
		{{releaseTargetConfigIdentifier}} /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_ASSET_PATHS = "{{projectName}}/Preview Content";
				ENABLE_PREVIEWS = YES;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;
				INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "{{bundleIdentifier}}";
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			};
			name = Release;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		{{projectConfigListIdentifier}} /* Build configuration list for PBXProject "{{projectName}}" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				{{debugConfigIdentifier}} /* Debug */,
				{{releaseConfigIdentifier}} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
		{{buildConfigListIdentifier}} /* Build configuration list for PBXNativeTarget "{{projectName}}" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				{{debugTargetConfigIdentifier}} /* Debug */,
				{{releaseTargetConfigIdentifier}} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
/* End XCConfigurationList section */
	};
	rootObject = {{projectIdentifier}} /* Project object */;
}
`;

    // Generate unique identifiers for Xcode project
    const identifiers = this.generateXcodeIdentifiers(config);
    
    const template = handlebars.compile(pbxprojTemplate);
    const content = template({
      projectName: config.projectName,
      bundleIdentifier: config.bundleIdentifier,
      ...identifiers
    });

    await fs.writeFile(path.join(projectDir, `${config.projectName}.xcodeproj/project.pbxproj`), content);
  }

  generateXcodeIdentifiers(config) {
    // Generate UUID-style identifiers for Xcode project
    const generateUUID = () => {
      return 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'.replace(/[X]/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
      }).toUpperCase();
    };

    return {
      projectIdentifier: generateUUID(),
      appIdentifier: generateUUID(),
      targetIdentifier: generateUUID(),
      mainGroupIdentifier: generateUUID(),
      appGroupIdentifier: generateUUID(),
      frameworksGroupIdentifier: generateUUID(),
      productsGroupIdentifier: generateUUID(),
      assetsGroupIdentifier: generateUUID(),
      previewContentGroupIdentifier: generateUUID(),
      coreDataGroupIdentifier: generateUUID(),
      frameworksPhaseIdentifier: generateUUID(),
      sourcesPhaseIdentifier: generateUUID(),
      resourcesPhaseIdentifier: generateUUID(),
      buildConfigListIdentifier: generateUUID(),
      projectConfigListIdentifier: generateUUID(),
      debugConfigIdentifier: generateUUID(),
      releaseConfigIdentifier: generateUUID(),
      debugTargetConfigIdentifier: generateUUID(),
      releaseTargetConfigIdentifier: generateUUID()
    };
  }

  async generateInfoPlist(projectDir, config) {
    const infoPlistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>UIApplicationSceneManifest</key>
	<dict>
		<key>UIApplicationSupportsMultipleScenes</key>
		<false/>
		<key>UISceneConfigurations</key>
		<dict>
			<key>UIWindowSceneSessionRoleApplication</key>
			<array>
				<dict>
					<key>UISceneConfigurationName</key>
					<string>Default Configuration</string>
					<key>UISceneDelegateClassName</key>
					<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
				</dict>
			</array>
		</dict>
	</dict>
	<key>UIApplicationSupportsIndirectInputEvents</key>
	<true/>
	<key>UIBackgroundModes</key>
	<array/>
	<key>UILaunchScreen</key>
	<dict/>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>armv7</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
</dict>
</plist>`;

    await fs.writeFile(path.join(projectDir, `${config.projectName}/Info.plist`), infoPlistTemplate);
  }

  async generateSourceFiles(projectDir, config) {
    // AppDelegate.swift
    const appDelegateTemplate = `import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
        // If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
        // Use this method to release any resources that were specific to the discarded scenes, as they will not return.
    }
}`;

    await fs.writeFile(path.join(projectDir, `${config.projectName}/AppDelegate.swift`), appDelegateTemplate);

    // SceneDelegate.swift
    const sceneDelegateTemplate = `import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        let window = UIWindow(windowScene: windowScene)
        let navigationController = UINavigationController(rootViewController: ViewController())
        window.rootViewController = navigationController
        self.window = window
        window.makeKeyAndVisible()
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        // Called as the scene is being released by the system.
        // This occurs shortly after the scene enters the background, or when its session is discarded.
        // Release any resources associated with this scene that can be re-created the next time the scene connects.
        // The scene may re-connect later, as its session was not necessarily discarded (see \`application:didDiscardSceneSessions\` instead).
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Called when the scene has moved from an inactive state to an active state.
        // Use this method to restart any tasks that were paused (or not yet started) when the scene was inactive.
    }

    func sceneWillResignActive(_ scene: UIScene) {
        // Called when the scene will move from an active state to an inactive state.
        // This may occur due to temporary interruptions (ex. an incoming phone call).
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        // Called as the scene transitions from the background to the foreground.
        // Use this method to undo the changes made on entering the background.
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        // Called as the scene transitions from the foreground to the background.
        // Use this method to save data, release shared resources, and store enough scene-specific state information
        // to restore the scene back to its current state.
    }
}`;

    await fs.writeFile(path.join(projectDir, `${config.projectName}/SceneDelegate.swift`), sceneDelegateTemplate);

    // ViewController.swift
    const viewControllerTemplate = `import UIKit

class ViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        title = "{{projectName}}"
        
        // Add your UI components here
        let label = UILabel()
        label.text = "Welcome to {{projectName}}"
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
}`;

    const template = handlebars.compile(viewControllerTemplate);
    const content = template({ projectName: config.projectName });
    await fs.writeFile(path.join(projectDir, `${config.projectName}/ViewController.swift`), content);
  }

  async generateStoryboards(projectDir, config) {
    // Launch Screen
    const launchScreenTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="13122.16" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="13104.12"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <color key="backgroundColor" xcode11CocoaTouchSystemColor="systemBackgroundColor" cocoaTouchSystemColor="whiteColor"/>
                        <viewLayoutGuide key="safeArea" id="6Tk-OE-BBY"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
</document>`;

    await fs.writeFile(path.join(projectDir, `${config.projectName}/LaunchScreen.storyboard`), launchScreenTemplate);
  }

  async generateDataModels(projectDir, config) {
    if (config.databaseSchema && config.databaseSchema.tables) {
      const modelDir = path.join(projectDir, `${config.projectName}/Models`);
      await fs.ensureDir(modelDir);

      for (const table of config.databaseSchema.tables) {
        const modelTemplate = `import Foundation

struct {{pascalCase tableName}}: Codable {
    {{#each columns}}
    let {{camelCase name}}: {{type}}
    {{/each}}
    
    enum CodingKeys: String, CodingKey {
        {{#each columns}}
        case {{camelCase name}} = "{{name}}"
        {{/each}}
    }
    
    // MARK: - Initializer
    init({{#each columns}}{{camelCase name}}: {{type}}{{#if @last}}{{else}}, {{/if}}{{/each}}) {
        {{#each columns}}
        self.{{camelCase name}} = {{camelCase name}}
        {{/each}}
    }
}
`;

        const template = handlebars.compile(modelTemplate);
        const content = template({
          tableName: table.name,
          columns: table.columns
        });

        await fs.writeFile(path.join(modelDir, `${this.pascalCase(table.name)}.swift`), content);
      }
    }
  }

  async generateApiServices(projectDir, config) {
    if (config.apiEndpoints && config.apiEndpoints.length > 0) {
      const serviceDir = path.join(projectDir, `${config.projectName}/Services`);
      await fs.ensureDir(serviceDir);

      const apiServiceTemplate = `import Foundation

class APIService {
    static let shared = APIService()
    private let baseURL = "https://api.example.com"
    private let session = URLSession.shared
    
    private init() {}
    
    {{#each endpoints}}
    func {{camelCase name}}({{#each parameters}}{{name}}: {{type}}{{#if @last}}{{else}}, {{/if}}{{/each}}) async throws -> {{returnType}} {
        guard let url = URL(string: "\(baseURL){{path}}") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "{{uppercase method}}"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        {{#if hasBody}}
        let body = [{{#each parameters}}
            "{{name}}": {{name}}{{#if @last}}{{else}},{{/if}}
        {{/each}}]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        {{/if}}
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode({{returnType}}.self, from: data)
    }
    {{/each}}
}

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int)
    case decodingError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let statusCode):
            return "Server error with status code: \(statusCode)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        }
    }
}
`;

      const template = handlebars.compile(apiServiceTemplate);
      const content = template({
        endpoints: config.apiEndpoints
      });

      await fs.writeFile(path.join(serviceDir, "APIService.swift"), content);
    }
  }

  async generateCoreData(projectDir, config) {
    const coreDataDir = path.join(projectDir, `${config.projectName}/Core Data`);
    await fs.ensureDir(coreDataDir);

    const coreDataStackTemplate = `import Foundation
import CoreData

class CoreDataStack {
    static let shared = CoreDataStack()
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "{{projectName}}")
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Failed to load Core Data stack: \(error)")
            }
        }
        return container
    }()
    
    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    func save() {
        guard context.hasChanges else { return }
        
        do {
            try context.save()
        } catch {
            print("Failed to save Core Data: \(error)")
        }
    }
    
    func fetch<T: NSManagedObject>(_ request: NSFetchRequest<T>) -> [T] {
        do {
            return try context.fetch(request)
        } catch {
            print("Failed to fetch: \(error)")
            return []
        }
    }
    
    func delete(_ object: NSManagedObject) {
        context.delete(object)
        save()
    }
}
`;

    const template = handlebars.compile(coreDataStackTemplate);
    const content = template({ projectName: config.projectName });
    await fs.writeFile(path.join(coreDataDir, "CoreDataStack.swift"), content);
  }

  async generateAssets(projectDir, config) {
    // AppIcon.json
    const appIconTemplate = `{
  "images" : [
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}`;

    await fs.writeFile(path.join(projectDir, `${config.projectName}/Assets.xcassets/AppIcon.appiconset/Contents.json`), appIconTemplate);
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

module.exports = iOSGenerator;