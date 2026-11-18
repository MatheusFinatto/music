// AGP 9.5 pairs with Android Studio Rabbit 2 and needs Gradle 9.6 (see gradle-wrapper.properties).
// AGP 9 compiles the app's Kotlin itself ("built-in Kotlin"). The multiplatform plugin is only for :core,
// pinned to the same Kotlin AGP brings (2.2.10) so the app's compiler doesn't change.
plugins {
    id("com.android.application") version "9.5.0" apply false
    kotlin("multiplatform") version "2.2.10" apply false
}
