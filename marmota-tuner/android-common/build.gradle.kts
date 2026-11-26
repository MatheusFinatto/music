// Android code shared by the two apps (Marmota Tuner and Marmota Trainer): microphone capture and the optional account.
// The logic shared with the website stays in :core; this is only what needs the Android SDK.
plugins {
    id("com.android.library")
}

android {
    namespace = "br.musica.marmota.common"
    compileSdk = 35
    defaultConfig {
        minSdk = 26
        consumerProguardFiles("consumer-rules.pro")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    api(project(":core"))
    // The optional account (see .specs/001-conta-e-sincronizacao.md): Google sign-in through the Credential Manager, only when
    // the person taps the "G". Firebase itself is reached by its REST API, not its SDK (the SDK starts itself when the app opens).
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
}
