# WeatherGPT — Native Android App Build & Deployment Guide

This document provides step-by-step instructions for building, running, and demonstrating the **WeatherGPT Native Android Application** on Android Studio, an Emulator, or a physical Android smartphone.

---

## 1. Project Overview & Architecture

WeatherGPT Native Android App is built with **Kotlin, Material 3, and Coroutines**, connecting to the FastAPI backend and Groq LLM:

* **Architecture**: MVVM with Modular Fragments and ViewBinding.
* **Bottom Navigation (5 Tabs)**:
  1. **Home**: Hero weather card, 2x2 live metrics (Humidity, Wind, Rain %, UV), Rain probability summary, Dynamic Persona AI Insight card, and Farmer Advisory.
  2. **Ask AI**: Conversational WeatherGPT chat with Speech-to-Text (STT), Text-to-Speech (TTS) read-aloud, and quick suggestion chips.
  3. **Forecast**: 7-day comprehensive forecast with sunrise/sunset and rainfall totals.
  4. **Alerts**: Real-time severe weather alert stream connected over WebSockets with emergency recommendations.
  5. **Profile / Settings**: Multi-language selector (7 Indian languages: EN, HI, TA, TE, BN, MR, GU), Persona switcher (Farmer, Commuter, Aviation, Outdoor), Unit toggle (°C / °F), and dynamic Backend Server URL configurator.

---

## 2. Prerequisites

1. **Android Studio**: Android Studio Iguana, Jellyfish, Koala, Ladybug, or newer.
2. **JDK**: Java 17 or Java 21 (bundled with Android Studio).
3. **Android SDK**: Compile SDK 34, Minimum SDK 24 (Android 7.0+).
4. **Backend Server**: Ensure the WeatherGPT FastAPI backend is running (`http://127.0.0.1:8000`).

---

## 3. Opening & Building in Android Studio

### Step 1: Open Project in Android Studio
1. Launch **Android Studio**.
2. Click **File > Open** and select the `weather_gpt/android` directory.
3. Allow Gradle to sync dependencies automatically.

### Step 2: Dependencies Synced in `build.gradle.kts`
The project uses the following dependencies:
```kotlin
dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("androidx.viewpager2:viewpager2:1.0.0")
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
```

---

## 4. Building the Debug APK

1. In Android Studio's top menu bar, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Once the build finishes, a notification will appear: **"APK(s) generated successfully"**.
3. Click the **locate** link in the notification popup.
4. The generated APK will be located at:
   ```
   android/build/outputs/apk/debug/app-debug.apk
   ```

### Command-Line Build (Optional)
If you have Gradle installed in your terminal:
```bash
./gradlew assembleDebug
```

---

## 5. Building the Signed / Release APK

1. In Android Studio, go to **Build > Generate Signed Bundle / APK...**.
2. Select **APK** and click **Next**.
3. Choose or create a **Key store path** (create a new `.jks` keystore if you don't have one).
4. Enter your Keystore password, key alias, and key password.
5. Select **release** build variant and check **V1 (Jar Signature)** and **V2 (Full APK Signature)**.
6. Click **Finish**. The output release APK will be in:
   ```
   android/app/release/app-release.apk
   ```

---

## 6. Running on Physical Device vs. Android Emulator

### A. Testing on Android Emulator
- The app defaults to `http://10.0.2.2:8000`, which automatically routes to `localhost:8000` on your host development machine.
- No network configuration needed.

### B. Testing on a Physical Android Device (Wi-Fi)
1. Ensure both your computer (running the FastAPI backend) and your Android phone are on the **same Wi-Fi network**.
2. Find your computer's local IP address:
   - On Windows: Run `ipconfig` in PowerShell (e.g. `192.168.1.45`).
3. Open the WeatherGPT app on your phone.
4. Go to the **Profile** tab > tap **⚙️ Backend Server URL**.
5. Enter `http://192.168.1.45:8000` and tap **Save**.
6. All weather data, live AI persona chat, and WebSocket alerts will now communicate with your backend!

---

## 7. Testing Key Features in the App

1. **Onboarding Experience**:
   - Screen 1: Welcome & Value Proposition.
   - Screen 2: Location Access.
   - Screen 3: Language Choice (English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati).
   - Screen 4: Persona Selection (🌾 Farming, 🚗 Commute, ✈️ Aviation, 🏃 Outdoor).
2. **Hero Dashboard (Home)**:
   - Dynamic real-time temperature, condition emoji, feels-like temperature.
   - 2x2 Metrics (Humidity, Wind speed, Rain chance).
   - Dynamic Persona Advisory card (Farmer irrigation guidance, pesticide warnings, commute alerts).
   - Quick Voice Action button ("Ask WeatherGPT").
3. **Conversational AI Weather Chat (Ask AI)**:
   - Ask questions like: *"Should I irrigate my wheat field today?"* or *"Will it rain in Delhi this evening?"*.
   - Tap the **🎤 Microphone** button for native voice recognition in your chosen language.
   - Tap the **🔊 Speaker** button on any AI response for instant text-to-speech voice playback.
   - Use the 4 quick prompt chips for instant answers.
4. **7-Day Forecast (Forecast)**:
   - 7-Day weather cards with min/max temperatures, rain percentages, and sunrise/sunset timings.
5. **Severe Weather Alerts (Alerts)**:
   - Real-time early-warning alerts streamed over WebSockets with severity ratings (Information, Warning, Severe, Emergency) and actionable checklists.
6. **Profile & Settings (Profile)**:
   - Switch personas, change languages, toggle Celsius/Fahrenheit, auto-detect location with GPS, or change the backend IP.
