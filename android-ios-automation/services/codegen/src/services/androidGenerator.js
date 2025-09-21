const fs = require("fs-extra");
const path = require("path");
const handlebars = require("handlebars");
const archiver = require("archiver");
const logger = require("../config/logger");

class AndroidGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates/android");
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
        databaseSchema
      } = projectConfig;

      logger.info("Starting Android project generation", { projectName, packageName });

      // Create project directory structure
      const projectDir = path.join("/tmp", `android-${Date.now()}-${projectName}`);
      await fs.ensureDir(projectDir);

      // Generate Android project structure
      await this.generateProjectStructure(projectDir, projectConfig);
      
      // Generate build configuration
      await this.generateBuildConfig(projectDir, projectConfig);
      
      // Generate manifest
      await this.generateManifest(projectDir, projectConfig);
      
      // Generate activities and fragments
      await this.generateActivities(projectDir, projectConfig);
      
      // Generate layouts
      await this.generateLayouts(projectDir, projectConfig);
      
      // Generate data models
      await this.generateDataModels(projectDir, projectConfig);
      
      // Generate API services
      await this.generateApiServices(projectDir, projectConfig);
      
      // Generate database helpers
      await this.generateDatabaseHelpers(projectDir, projectConfig);
      
      // Generate utilities
      await this.generateUtilities(projectDir, projectConfig);

      // Create ZIP archive
      const zipPath = await this.createZipArchive(projectDir, projectName);

      // Clean up temporary directory
      await fs.remove(projectDir);

      logger.info("Android project generation completed", { projectName, zipPath });

      return {
        success: true,
        projectPath: zipPath,
        filesGenerated: await this.countGeneratedFiles(projectDir),
        buildConfig: {
          gradleVersion: "8.0",
          minSdk: 21,
          targetSdk: 34,
          compileSdk: 34
        }
      };

    } catch (error) {
      logger.error("Android project generation failed", { error: error.message, projectConfig });
      throw error;
    }
  }

  async generateProjectStructure(projectDir, config) {
    const structure = [
      "app/src/main/java",
      "app/src/main/res",
      "app/src/main/res/layout",
      "app/src/main/res/values",
      "app/src/main/res/drawable",
      "app/src/main/res/mipmap-hdpi",
      "app/src/main/res/mipmap-mdpi",
      "app/src/main/res/mipmap-xhdpi",
      "app/src/main/res/mipmap-xxhdpi",
      "app/src/main/res/mipmap-xxxhdpi",
      "app/src/test/java",
      "app/src/androidTest/java"
    ];

    for (const dir of structure) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  async generateBuildConfig(projectDir, config) {
    const buildGradleTemplate = `
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '{{packageName}}'
    compileSdk {{compileSdk}}

    defaultConfig {
        applicationId "{{packageName}}"
        minSdk {{minSdk}}
        targetSdk {{targetSdk}}
        versionCode 1
        versionName "1.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = '1.8'
    }
    
    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.navigation:navigation-fragment-ktx:2.7.6'
    implementation 'androidx.navigation:navigation-ui-ktx:2.7.6'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.2'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2'
    implementation 'androidx.recyclerview:recyclerview:1.3.2'
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    implementation 'com.github.bumptech.glide:glide:4.16.0'
    implementation 'androidx.room:room-runtime:2.6.1'
    implementation 'androidx.room:room-ktx:2.6.1'
    kapt 'androidx.room:room-compiler:2.6.1'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
`;

    const template = handlebars.compile(buildGradleTemplate);
    const content = template({
      packageName: config.packageName,
      compileSdk: 34,
      minSdk: 21,
      targetSdk: 34
    });

    await fs.writeFile(path.join(projectDir, "app/build.gradle"), content);
  }

  async generateManifest(projectDir, config) {
    const manifestTemplate = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.{{pascalCase projectName}}"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.{{pascalCase projectName}}">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>

</manifest>`;

    const template = handlebars.compile(manifestTemplate);
    const content = template({ projectName: config.projectName });

    await fs.writeFile(path.join(projectDir, "app/src/main/AndroidManifest.xml"), content);
  }

  async generateActivities(projectDir, config) {
    const mainActivityTemplate = `package {{packageName}}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import {{packageName}}.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupNavigation()
    }
    
    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController
        
        val bottomNavigationView = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNavigationView.setupWithNavController(navController)
    }
}
`;

    const template = handlebars.compile(mainActivityTemplate);
    const content = template({ packageName: config.packageName });

    const packagePath = config.packageName.replace(/\./g, "/");
    const activityDir = path.join(projectDir, "app/src/main/java", packagePath);
    await fs.ensureDir(activityDir);
    await fs.writeFile(path.join(activityDir, "MainActivity.kt"), content);
  }

  async generateLayouts(projectDir, config) {
    const mainLayoutTemplate = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <androidx.fragment.app.FragmentContainerView
        android:id="@+id/nav_host_fragment"
        android:name="androidx.navigation.fragment.NavHostFragment"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:defaultNavHost="true"
        app:layout_constraintBottom_toTopOf="@+id/bottom_navigation"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:navGraph="@navigation/nav_graph" />

    <com.google.android.material.bottomnavigation.BottomNavigationView
        android:id="@+id/bottom_navigation"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginStart="0dp"
        android:layout_marginEnd="0dp"
        android:background="?android:attr/windowBackground"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:menu="@menu/bottom_nav_menu" />

</androidx.constraintlayout.widget.ConstraintLayout>`;

    await fs.writeFile(path.join(projectDir, "app/src/main/res/layout/activity_main.xml"), mainLayoutTemplate);
  }

  async generateDataModels(projectDir, config) {
    // Generate data models based on requirements
    if (config.databaseSchema && config.databaseSchema.tables) {
      const packagePath = config.packageName.replace(/\./g, "/");
      const modelDir = path.join(projectDir, "app/src/main/java", packagePath, "models");
      await fs.ensureDir(modelDir);

      for (const table of config.databaseSchema.tables) {
        const modelTemplate = `package {{packageName}}.models

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "{{snake_case tableName}}")
data class {{pascalCase tableName}}(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    {{#each columns}}
    val {{camelCase name}}: {{type}}{{#if @last}}{{else}},{{/if}}
    {{/each}}
) {
    companion object {
        fun fromJson(json: String): {{pascalCase tableName}} {
            // Implement JSON parsing
            return {{pascalCase tableName}}()
        }
    }
}
`;

        const template = handlebars.compile(modelTemplate);
        const content = template({
          packageName: config.packageName,
          tableName: table.name,
          columns: table.columns
        });

        await fs.writeFile(path.join(modelDir, `${this.pascalCase(table.name)}.kt`), content);
      }
    }
  }

  async generateApiServices(projectDir, config) {
    if (config.apiEndpoints && config.apiEndpoints.length > 0) {
      const packagePath = config.packageName.replace(/\./g, "/");
      const apiDir = path.join(projectDir, "app/src/main/java", packagePath, "api");
      await fs.ensureDir(apiDir);

      const apiServiceTemplate = `package {{packageName}}.api

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface ApiService {
    {{#each endpoints}}
    @{{method}}("{{path}}")
    suspend fun {{camelCase name}}({{#each parameters}}
        @{{paramType}}("{{name}}") {{name}}: {{type}}{{#if @last}}{{else}}, {{/if}}{{/each}}
    ): {{returnType}}
    
    {{/each}}
    
    companion object {
        private const val BASE_URL = "https://api.example.com/"
        
        fun create(): ApiService {
            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        }
    }
}
`;

      const template = handlebars.compile(apiServiceTemplate);
      const content = template({
        packageName: config.packageName,
        endpoints: config.apiEndpoints
      });

      await fs.writeFile(path.join(apiDir, "ApiService.kt"), content);
    }
  }

  async generateDatabaseHelpers(projectDir, config) {
    const packagePath = config.packageName.replace(/\./g, "/");
    const dbDir = path.join(projectDir, "app/src/main/java", packagePath, "database");
    await fs.ensureDir(dbDir);

    const databaseTemplate = `package {{packageName}}.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import {{packageName}}.models.*

@Database(
    entities = [
        {{#each tables}}
        {{pascalCase name}}::class{{#if @last}}{{else}},{{/if}}
        {{/each}}
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    {{#each tables}}
    abstract fun {{camelCase name}}Dao(): {{pascalCase name}}Dao
    {{/each}}
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "{{snake_case projectName}}_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`;

    const template = handlebars.compile(databaseTemplate);
    const content = template({
      packageName: config.packageName,
      projectName: config.projectName,
      tables: config.databaseSchema?.tables || []
    });

    await fs.writeFile(path.join(dbDir, "AppDatabase.kt"), content);
  }

  async generateUtilities(projectDir, config) {
    const packagePath = config.packageName.replace(/\./g, "/");
    const utilsDir = path.join(projectDir, "app/src/main/java", packagePath, "utils");
    await fs.ensureDir(utilsDir);

    const utilsTemplate = `package {{packageName}}.utils

import android.content.Context
import android.widget.Toast
import java.text.SimpleDateFormat
import java.util.*

object Utils {
    fun showToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
    
    fun formatDate(date: Date): String {
        val format = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        return format.format(date)
    }
    
    fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
}
`;

    await fs.writeFile(path.join(utilsDir, "Utils.kt"), utilsTemplate);
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

module.exports = AndroidGenerator;