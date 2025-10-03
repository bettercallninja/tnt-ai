# Mobile App (React Native)

React Native client for offline speech-to-text + translation. Record audio, send to backend, get transcription and translation.

## Prerequisites

- **Node.js 18+** (tested with Node 22)
- **JDK 17+** (required for Android build)
- **Android SDK** with API 33+ emulator or physical device
- **Backend running** on port 8080 (see `backend/README.md`)

## Setup

### 1. Install Node Dependencies

```powershell
cd mobile
npm install
```

### 2. Install JDK 17+ (Required for Android Build)

**Check current Java version:**
```powershell
java -version
```

If you see Java 1.8 or lower, install JDK 17+:

1. **Download**: https://adoptium.net/temurin/releases/
   - Select: Version 17 (LTS), Windows x64, .msi installer
   
2. **Install** the downloaded .msi file

3. **Set JAVA_HOME** (run this or use the helper script):
   ```powershell
   cd android
   .\set-java.ps1
   ```
   
   Or manually:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
   $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
   ```

4. **Verify**:
   ```powershell
   java -version
   # Should show version 17 or higher
   ```

### 3. Start Backend Server

```powershell
cd ..\backend
.\scripts\start-all.ps1
```

Backend will run on `http://localhost:8080`

## Running the App

### Development Mode

1. **Start Metro bundler**:
   ```powershell
   cd mobile
   npm start
   ```

2. **In a new terminal, run on Android**:
   ```powershell
   cd mobile
   npm run android
   ```

3. **For device on same network**, enable port forwarding:
   ```powershell
   adb reverse tcp:8080 tcp:8080
   ```

### Build Release APK

1. **Ensure JDK 17+ is set**:
   ```powershell
   cd android
   .\set-java.ps1
   ```

2. **Build release**:
   ```powershell
   cd android
   .\gradlew assembleRelease
   ```

3. **APK location**:
   ```
   mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

## Troubleshooting

### "Android build requires JDK 17 or newer"
**Solution**: Install JDK 17+ and run `.\android\set-java.ps1`

### "Could not connect to backend"
**Solution**: 
- Ensure backend is running: `.\backend\scripts\start-all.ps1`
- For device: Run `adb reverse tcp:8080 tcp:8080`
- Update Base URL in app if backend is on different machine

### Metro bundler issues
**Solution**:
```powershell
cd mobile
npm start -- --reset-cache
```
   translation. The Base URL field defaults to `http://10.0.2.2:8000` (Android emulator). Change it
   to your backend hostname/IP when running on a device.

## Building an installable APK

```powershell
Set-Location -LiteralPath 'd:\ilia\PyProj\AndroidAppT&T\mobile\android'
./gradlew assembleRelease
```

The generated APK will be at
`d:\ilia\PyProj\AndroidAppT&T\mobile\android\app\build\outputs\apk\release\app-release.apk`.
Install it on a device with:

```powershell
adb install -r 'd:\ilia\PyProj\AndroidAppT&T\mobile\android\app\build\outputs\apk\release\app-release.apk'
```

> **Note:** The default release build is signed with the debug keystore. Before distribution, create
a real signing config and update `android/app/build.gradle`.

## Distribution checklist

- Update `android/app/src/main/AndroidManifest.xml` if you need additional permissions.
- Replace launcher icons in `android/app/src/main/res/mipmap-*`.
- Adjust the app name in `strings.xml` and `app.json` to match your brand.
- Switch the backend URL to a production host or surface a configurable settings screen.

Happy shipping!
