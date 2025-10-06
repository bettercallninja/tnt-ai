# TNT AI - Live Transcription & Translation Mobile App

A professional React Native mobile app with ChatGPT-style UI for real-time speech transcription and translation.

## Features

✨ **ChatGPT-Style Interface** - Modern chat bubbles with message history  
🎤 **Live Transcription** - Record audio and get instant transcriptions  
🌍 **Multi-Language Translation** - Support for English, Turkish, Persian, and Arabic  
💾 **Local History** - Save and browse past conversations  
📱 **Haptic Feedback** - Tactile responses during recording  
🔄 **Backend Health Monitoring** - Real-time status indicator  
🎨 **World-Class Design** - Clean, intuitive, and responsive UI

## Quick Start

### Prerequisites
- Node.js & npm installed
- Expo CLI: `npm install -g expo-cli`
- Backend server running (see `../backend/README.md`)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android   # Android
npm run ios       # iOS  
npm run web       # Web browser
```

## Project Structure

```
mobile/
├── app/
│   └── index.tsx              # Main screen with ChatGPT-style UI
├── components/
│   ├── MessageBubble.tsx      # Individual message component
│   └── HistorySidebar.tsx     # Chat history sidebar
├── services/
│   ├── api.ts                 # Backend API integration
│   └── storage.ts             # Local storage service
├── types/
│   └── index.ts               # TypeScript definitions
├── functions/
│   ├── recordSpeech.tsx       # Audio recording logic
│   └── transcribeSpeech.tsx   # (Legacy - not used)
└── hooks/
    └── useWebFocus.ts         # Web platform hook
```

## Backend Configuration

The app automatically detects the backend URL based on platform:

### Android Emulator
```typescript
// Uses emulator's localhost mapping
http://10.0.2.2:8080
```

### iOS Simulator
```typescript
// Direct localhost
http://localhost:8080
```

### Real Device
```typescript
// Set environment variable in .env file:
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8080

// Example:
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
```

**Finding Your Computer's IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` (look for inet)

## Usage Guide

### Recording & Translation

1. **Select Target Language** - Choose from English, Turkish, Persian, or Arabic
2. **Check Backend Status** - Ensure "Online" badge is green in header
3. **Hold to Record** - Press and hold the microphone button
4. **Release to Process** - Your speech will be transcribed and translated
5. **View Results** - See transcript and translation in a chat bubble

### Managing Chat History

- **View History** - Tap the bars icon (☰) in top-left corner
- **Switch Chats** - Tap any session in the sidebar
- **New Chat** - Tap the plus icon (+) in top-right corner
- **Delete Chat** - Tap the trash icon on any session (with confirmation)

### Message Display

Each message shows:
- 🎤 **Original Speech** - Your transcribed words
- 🌍 **Translation** - Translated to your target language
- 🔤 **Detected Language** - Auto-detected source language
- 🕒 **Timestamp** - When the message was created

## Technical Details

### Dependencies

Core:
- `react-native` 0.74.2
- `expo` ~51.0.17
- `expo-av` ~14.0.6 (audio recording)

New Features:
- `@react-native-async-storage/async-storage` ^1.23.1 (local storage)
- `expo-file-system` ~17.0.1 (file handling)
- `expo-haptics` ~13.0.1 (tactile feedback)

### API Integration

**Endpoint:** `POST /v1/transcribe_translate`

**Request:**
```typescript
FormData {
  file: File (audio/webm or audio/wav)
  target_lang: string ('English' | 'Turkish' | 'Persian' | 'Arabic')
}
```

**Response:**
```typescript
{
  transcript: string,      // Transcribed text
  translation: string,     // Translated text
  lang: string            // Detected language code
}
```

### Local Storage Schema

**Session:**
```typescript
{
  id: string,              // Unique identifier
  title: string,           // First message preview
  messages: Message[],     // Array of messages
  createdAt: number,       // Unix timestamp
  updatedAt: number        // Unix timestamp
}
```

**Message:**
```typescript
{
  id: string,              // Unique identifier
  type: 'user',            // Message type
  audioUri: string,        // Local audio file path
  transcript?: string,     // Transcribed text
  translation?: string,    // Translated text
  detectedLanguage?: string,  // Source language
  targetLanguage: string,  // Target language
  timestamp: number,       // Unix timestamp
  isLoading?: boolean,     // Processing state
  error?: string          // Error message
}
```

## Troubleshooting

### "Backend Offline" Error

**Problem:** Red status badge shows "Offline"

**Solutions:**
1. Check backend is running: `cd ../backend && .\scripts\start.ps1 -Mode dev`
2. Verify backend health: Open `http://localhost:8080/docs` in browser
3. Check network connectivity
4. For real devices, ensure correct IP in `.env` file

### Recording Not Working

**Problem:** Microphone button doesn't respond

**Solutions:**
1. Grant microphone permissions to Expo Go app
2. Check backend is online (button disabled when offline)
3. Wait for previous recording to finish processing
4. Restart the app: Close Expo Go and reopen

### Messages Not Saving

**Problem:** Chat history disappears after restart

**Solutions:**
1. Check AsyncStorage permissions
2. Clear app data and restart
3. Check console for storage errors: `npm start` and view terminal logs

### Translation Not Working

**Problem:** Only transcript shows, no translation

**Solutions:**
1. Verify backend LibreTranslate is running: `docker ps` (should show libretranslate container)
2. Check backend logs for translation errors
3. Try selecting a different target language
4. Restart backend: `cd ../backend && .\scripts\stop.ps1 -All && .\scripts\start.ps1 -Mode dev`

### Platform-Specific Issues

**Android Emulator:**
- Ensure using `http://10.0.2.2:8080` (automatically configured)
- Don't use `localhost` or `127.0.0.1`

**iOS Simulator:**
- Uses `http://localhost:8080` automatically
- Ensure backend is on same machine

**Real Device:**
- Must be on same WiFi network as backend
- Set `EXPO_PUBLIC_API_URL` in `.env` file
- Check firewall allows port 8080

## Performance Tips

1. **Clear Old Sessions** - Delete unused chats to free up storage
2. **Close Sidebar** - Keep history sidebar closed during recording
3. **Stable Network** - Ensure strong WiFi connection for faster processing
4. **Backend Optimization** - Use production mode for faster transcription (see `../backend/README.md`)

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# Android APK
npm run android -- --variant release

# iOS (requires Mac + Xcode)
npm run ios -- --configuration Release
```

### Environment Variables
Create `.env` file in mobile root:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
```

## Known Limitations

- Audio playback from history not yet implemented (coming soon)
- Maximum session limit: 100 chats (older ones auto-deleted)
- Audio format: WebM (web/Android) or WAV (iOS)
- Backend must support target language in LibreTranslate

## Contributing

When adding new features:
1. Update TypeScript types in `types/index.ts`
2. Add new services in `services/` directory
3. Create reusable components in `components/`
4. Update this README with new features

## Support

For issues:
1. Check backend logs: `cd ../backend && docker-compose logs`
2. Check mobile logs: View terminal where `npm start` is running
3. Clear app data and restart
4. Review `../backend/README.md` for backend troubleshooting

---

**Made with ❤️ using React Native + Expo + FastAPI**
