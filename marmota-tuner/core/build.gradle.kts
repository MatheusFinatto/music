import org.jetbrains.kotlin.gradle.dsl.JvmTarget

// The tuner's logic (detection, smoothing, note mapping, layout math), shared by two front ends:
// - jvm: used by the Android app (:app).
// - js: compiled to an ES module with TypeScript types and copied into the website (task exportToSite).
plugins {
    kotlin("multiplatform")
}

// The Node.js repository is declared in settings.gradle.kts; stop the plugin from adding its own.
listOf(project, rootProject).forEach { p ->
    p.plugins.withType<org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsPlugin> {
        p.the<org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsEnvSpec>().downloadBaseUrl.set(null as String?)
    }
}

kotlin {
    jvm {
        compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
    }
    js(IR) {
        outputModuleName = "tuner-core"
        browser { testTask { enabled = false } }
        binaries.library()
        generateTypeScriptDefinitions()
        useEsModules()
    }
    sourceSets {
        jvmTest.dependencies { implementation("junit:junit:4.13.2") }
    }
}

// The website can't run Gradle (Vercel has no JDK), so the compiled JS is committed to the site.
// Run after changing anything in core/src/commonMain: ./gradlew :core:exportToSite
val siteDir = rootDir.resolve("../src/core/pitch/generated")
tasks.register<Sync>("exportToSite") {
    description = "Copies the compiled JS + .d.mts into the website (src/core/pitch/generated)."
    from(tasks.named("jsBrowserProductionLibraryDistribution"))
    include("*.mjs", "*.d.ts")
    // TypeScript pairs foo.mjs with foo.d.mts, not foo.d.ts.
    rename("""(.*)\.d\.ts""", "$1.d.mts")
    into(siteDir)
}
