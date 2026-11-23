// Android code shared by the two apps (Marmota Tuner and Marmota Ear & Voice): microphone capture.
// The logic shared with the website stays in :core; this is only what needs the Android SDK.
plugins {
    id("com.android.library")
}

android {
    namespace = "br.musica.marmota.common"
    compileSdk = 35
    defaultConfig { minSdk = 26 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    api(project(":core"))
}
