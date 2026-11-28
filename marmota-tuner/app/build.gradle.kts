plugins {
    id("com.android.application")
}

android {
    namespace = "br.musica.marmotatuner"
    compileSdk = 35

    defaultConfig {
        applicationId = "br.musica.marmotatuner"
        minSdk = 26
        targetSdk = 35
        versionCode = 15
        versionName = "1.14"
    }

    // The release key lives outside the repo. Its path and password come from
    // ~/.gradle/gradle.properties (MARMOTA_KEYSTORE, MARMOTA_KEYSTORE_PASSWORD, MARMOTA_KEY_ALIAS).
    // Without them, release builds come out unsigned and everything else still works.
    val releaseKeystore = providers.gradleProperty("MARMOTA_KEYSTORE").orNull
    signingConfigs {
        if (releaseKeystore != null) {
            create("release") {
                storeFile = file(releaseKeystore)
                storePassword = providers.gradleProperty("MARMOTA_KEYSTORE_PASSWORD").get()
                keyAlias = providers.gradleProperty("MARMOTA_KEY_ALIAS").get()
                keyPassword = providers.gradleProperty("MARMOTA_KEYSTORE_PASSWORD").get()
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            if (releaseKeystore != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(project(":core"))
    implementation(project(":android-common"))
    testImplementation("junit:junit:4.13.2")
}
