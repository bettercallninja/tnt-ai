# Mobile App (React Native)

This package contains the React Native client for the offline speech-to-text + translation
workflow. The app lets you record audio, preview the captured snippet, send it to the FastAPI
backend for transcription + translation, and inspect the results.

## Prerequisites

- Node.js 18+ (tested with Node 22)
- Android SDK with an API 33+ emulator or a physical Android device
- Java 17 (Android Gradle plugin requirement)
- Python environment with the backend running on port `8000`
- `adb` on your `PATH`

## Install dependencies

```powershell
Set-Location -LiteralPath 'd:\ilia\PyProj\AndroidAppT&T\mobile'
& 'C:\Program Files\nodejs\npm.cmd' install
```

## Start the backend

```powershell
Set-Location -LiteralPath 'd:\ilia\PyProj\AndroidAppT&T\backend'
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

If you run the backend on another machine, update the Base URL field in the app before sending a
recording.

## Local development preview

1. Launch an Android emulator (AVD) or connect a physical device with USB debugging enabled.
2. In a new terminal, start Metro (the bundler/dev server):

   ```powershell
   Set-Location -LiteralPath 'd:\ilia\PyProj\AndroidAppT&T\mobile'
   & 'C:\Program Files\nodejs\npm.cmd' start
   ```

3. In another terminal, build and install the debug app:

   ```powershell
   Set-Location -LiteralPath 'd:\ilia\PyProj\AndroidAppT&T\mobile'
   & 'C:\Program Files\nodejs\npm.cmd' run android
   ```

   - For emulators the app should open automatically.
   - For a device on the same network, run `adb reverse tcp:8000 tcp:8000` if the backend is on your
     development machine.

4. Use the "Record" button to capture audio, preview the snippet, then send it for transcription +
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
