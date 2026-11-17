// AGP 9.5 pairs with Android Studio Rabbit 2 and needs Gradle 9.6 (see gradle-wrapper.properties).
// AGP 9 compiles Kotlin itself ("built-in Kotlin"), so no separate Kotlin plugin is applied.
plugins {
    id("com.android.application") version "9.5.0" apply false
}
