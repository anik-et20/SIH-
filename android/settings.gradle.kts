// Fix for AGP AndroidLocationsException when both ANDROID_PREFS_ROOT and ANDROID_USER_HOME are set
try {
    val processEnvClass = Class.forName("java.lang.ProcessEnvironment")
    
    val envField = processEnvClass.getDeclaredField("theEnvironment")
    envField.isAccessible = true
    @Suppress("UNCHECKED_CAST")
    (envField.get(null) as? MutableMap<String, String>)?.remove("ANDROID_PREFS_ROOT")

    val ciEnvField = processEnvClass.getDeclaredField("theCaseInsensitiveEnvironment")
    ciEnvField.isAccessible = true
    @Suppress("UNCHECKED_CAST")
    (ciEnvField.get(null) as? MutableMap<String, String>)?.remove("ANDROID_PREFS_ROOT")
} catch (_: Exception) {
}

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.10.0"
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "WeatherGPT"
include(":app")
