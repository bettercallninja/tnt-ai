# TNT AI Mobile App - Architecture Overview

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  app/index.tsx                            │  │
│  │              (Main Screen Component)                      │  │
│  │                                                           │  │
│  │  State Management:                                        │  │
│  │  • sessions: Session[]                                    │  │
│  │  • activeSession: Session | null                          │  │
│  │  • isRecording: boolean                                   │  │
│  │  • isProcessing: boolean                                  │  │
│  │  • targetLanguage: string                                 │  │
│  │  • backendOnline: boolean                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│           │                      │                      │         │
│           ▼                      ▼                      ▼         │
│  ┌────────────────┐   ┌─────────────────┐   ┌────────────────┐  │
│  │  Components    │   │    Services     │   │     Types      │  │
│  ├────────────────┤   ├─────────────────┤   ├────────────────┤  │
│  │ MessageBubble  │   │ StorageService  │   │ Message        │  │
│  │ HistorySidebar │   │ BackendAPI      │   │ Session        │  │
│  └────────────────┘   └─────────────────┘   │ Response       │  │
│                                              └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Platform Detection   │
                    └────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Android    │ │     iOS      │ │   Real Device│
        │  10.0.2.2    │ │  localhost   │ │  Custom IP   │
        └──────────────┘ └──────────────┘ └──────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                ▼
                    ┌────────────────────────┐
                    │   Backend API Server   │
                    │   (0.0.0.0:8080)      │
                    └────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Whisper    │ │LibreTranslate│ │    ffmpeg    │
        │ (turbo model)│ │  (Docker)    │ │(Normalizer)  │
        └──────────────┘ └──────────────┘ └──────────────┘
```

## 🔄 Data Flow - Recording & Transcription

```
User Action
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Press & Hold Mic Button                                  │
│    → handleStartRecording()                                 │
│    → Check backendOnline === true                           │
│    → Haptics.impactAsync(Medium)                            │
│    → recordSpeech(audioRecordingRef, setIsRecording)       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Recording Active                                         │
│    → isRecording = true                                     │
│    → Button turns red                                       │
│    → Pulse animation starts                                 │
│    → expo-av records audio                                  │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Release Mic Button                                       │
│    → handleStopRecording()                                  │
│    → audioRecording.stopAndUnloadAsync()                    │
│    → Get recordingUri                                       │
│    → Haptics.impactAsync(Light)                            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Create User Message (Placeholder)                        │
│    → userMessage = {                                        │
│         id: `msg_${Date.now()}`,                           │
│         type: 'user',                                       │
│         audioUri: recordingUri,                            │
│         targetLanguage: 'Turkish',                         │
│         isLoading: true                                    │
│      }                                                      │
│    → Update activeSession.messages                          │
│    → setActiveSession(updatedSession)                       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Fetch Audio Blob                                         │
│    → blob = await fetch(recordingUri).then(r => r.blob())  │
│    → isProcessing = true                                    │
│    → "Processing..." indicator shown                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Call Backend API                                         │
│    → BackendAPI.transcribeAndTranslate(blob, 'Turkish')    │
│    → FormData = {file: blob, target_lang: 'Turkish'}       │
│    → POST http://10.0.2.2:8080/v1/transcribe_translate     │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend Processing                                       │
│    → ffmpeg normalizes audio                                │
│    → Whisper transcribes → "Hello, how are you?"           │
│    → LibreTranslate translates → "Merhaba, nasılsın?"     │
│    → Return {transcript, translation, lang: "en"}           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Update Message                                           │
│    → completedMessage = {                                   │
│         ...userMessage,                                     │
│         transcript: "Hello, how are you?",                 │
│         translation: "Merhaba, nasılsın?",                │
│         detectedLanguage: "en",                            │
│         isLoading: false                                   │
│      }                                                      │
│    → Update session with completed message                  │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Save to Storage                                          │
│    → StorageService.saveSession(finalSession)              │
│    → AsyncStorage persists to disk                          │
│    → Session title = first 30 chars of transcript           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Display Result                                          │
│    → MessageBubble renders in FlatList                      │
│    → Blue bubble (user message)                             │
│    → Shows transcript + translation                         │
│    → Auto-scroll to bottom                                  │
│    → Haptics.notificationAsync(Success)                    │
│    → isProcessing = false                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Storage Architecture

```
AsyncStorage (Local Device)
    │
    ├─ @tnt-sessions (JSON Array)
    │   └─ [
    │       {
    │         id: "session_1234567890",
    │         title: "Hello, how are you?...",
    │         createdAt: 1234567890000,
    │         updatedAt: 1234567890500,
    │         messages: [
    │           {
    │             id: "msg_1234567890",
    │             type: "user",
    │             audioUri: "file:///.../recording.webm",
    │             transcript: "Hello, how are you?",
    │             translation: "Merhaba, nasılsın?",
    │             detectedLanguage: "en",
    │             targetLanguage: "Turkish",
    │             timestamp: 1234567890000
    │           },
    │           {
    │             id: "msg_1234567891",
    │             type: "user",
    │             audioUri: "file:///.../recording2.webm",
    │             transcript: "I'm doing great!",
    │             translation: "Harika gidiyorum!",
    │             detectedLanguage: "en",
    │             targetLanguage: "Turkish",
    │             timestamp: 1234567891000
    │           }
    │         ]
    │       },
    │       {
    │         id: "session_1234567892",
    │         title: "Good morning...",
    │         ...
    │       }
    │     ]
    │
    └─ @tnt-active-session
        └─ "session_1234567890"
```

## 🎨 UI Component Hierarchy

```
SafeAreaView (container)
│
├─ StatusBar (dark)
│
├─ View (header)
│   ├─ TouchableOpacity (history button ☰)
│   ├─ View (headerCenter)
│   │   ├─ Text ("TNT AI")
│   │   └─ View (statusBadge)
│   │       ├─ View (dot) [green/red]
│   │       └─ Text ("Online"/"Offline")
│   └─ TouchableOpacity (new chat button +)
│
├─ View (languageSelector)
│   ├─ Text ("Translate to:")
│   └─ View (languageButtons)
│       ├─ TouchableOpacity ("English")
│       ├─ TouchableOpacity ("Turkish")
│       ├─ TouchableOpacity ("Persian")
│       └─ TouchableOpacity ("Arabic")
│
├─ KeyboardAvoidingView (messagesContainer)
│   ├─ FlatList (messagesList) [if messages exist]
│   │   └─ MessageBubble × N
│   │       ├─ Animated.View (fade-in)
│   │       ├─ TouchableOpacity (audio icon 🔊)
│   │       ├─ View (transcript section)
│   │       │   ├─ Text ("🎤 You said:")
│   │       │   └─ Text (transcript)
│   │       ├─ View (translation section)
│   │       │   ├─ Text ("🌍 Translation (Turkish):")
│   │       │   └─ Text (translation, italic)
│   │       └─ View (footer)
│   │           ├─ Text ("Detected: en")
│   │           └─ Text ("14:23")
│   │
│   └─ View (emptyState) [if no messages]
│       ├─ FontAwesome (microphone icon)
│       ├─ Text ("Start Speaking")
│       └─ Text ("Press and hold...")
│
├─ View (recordingContainer)
│   ├─ View (processingIndicator) [if isProcessing]
│   │   ├─ ActivityIndicator
│   │   └─ Text ("Processing...")
│   ├─ Animated.View (pulse)
│   │   └─ TouchableOpacity (recordButton)
│   │       └─ FontAwesome (microphone) [or recording dot if active]
│   └─ Text (recordHint: "Hold to record" / "Release to stop")
│
└─ HistorySidebar (Modal)
    ├─ View (header)
    │   ├─ Text ("Chat History")
    │   └─ TouchableOpacity (close × button)
    ├─ TouchableOpacity (New Chat button)
    ├─ FlatList (sessions) [if sessions exist]
    │   └─ TouchableOpacity × N (session item)
    │       ├─ Text (session.title)
    │       ├─ Text ("X messages")
    │       ├─ Text (formatted date)
    │       └─ TouchableOpacity (delete 🗑️)
    └─ View (emptyState) [if no sessions]
        ├─ FontAwesome (comments icon)
        └─ Text ("No chat history yet")
```

## 🔌 API Integration

```
Frontend (Mobile)                      Backend (FastAPI)
─────────────────                      ─────────────────

BackendAPI.healthCheck()
    GET /docs                    ────▶  FastAPI Swagger UI
    └─ Returns: boolean                 └─ 200 OK

BackendAPI.transcribeAndTranslate()
    FormData:                    ────▶  POST /v1/transcribe_translate
      • file: Blob (audio)              │
      • target_lang: string             ▼
                                   Audio Processing:
                                     1. ffmpeg normalize
                                     2. Whisper transcribe
                                     3. LibreTranslate translate
                                        │
    TranscriptionResponse        ◀────  Return JSON:
      • transcript: string               {
      • translation: string               "transcript": "...",
      • lang: string                      "translation": "...",
                                          "lang": "en"
                                         }
```

## 📊 State Flow Diagram

```
App Launch
    │
    ▼
loadSessions()
    │
    ├─ Read AsyncStorage (@tnt-sessions)
    │   └─ setSessions([...])
    │
    ├─ Read AsyncStorage (@tnt-active-session)
    │   └─ setActiveSession(session)
    │
    └─ If no active session
        └─ createNewSession()
            └─ StorageService.createNewSession()
                └─ New Session { id, title, messages: [], ... }

checkBackendHealth()
    │
    └─ BackendAPI.healthCheck()
        ├─ Success → setBackendOnline(true)
        └─ Failure → setBackendOnline(false)

User Records Audio
    │
    ├─ handleStartRecording()
    │   └─ setIsRecording(true)
    │
    └─ handleStopRecording()
        ├─ setIsRecording(false)
        ├─ setIsProcessing(true)
        ├─ Create user message
        ├─ Update activeSession
        ├─ Call backend API
        ├─ Update message with results
        ├─ Save session to storage
        ├─ Update sessions array
        └─ setIsProcessing(false)

User Creates New Chat
    │
    └─ createNewSession()
        ├─ New Session created
        ├─ setActiveSession(newSession)
        ├─ Save to AsyncStorage
        └─ Update sessions array

User Switches Chat
    │
    └─ handleSelectSession(sessionId)
        ├─ Find session in sessions[]
        ├─ setActiveSession(session)
        └─ Save active ID to AsyncStorage

User Deletes Chat
    │
    └─ handleDeleteSession(sessionId)
        ├─ Alert confirmation
        ├─ StorageService.deleteSession(id)
        ├─ Remove from sessions[]
        └─ If active, create new session
```

## 🎯 Key Features Map

```
┌──────────────────────────────────────────────────────────┐
│                    Feature Matrix                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ChatGPT-Style UI            ✅ MessageBubble component  │
│  Live Transcription          ✅ expo-av + Backend API    │
│  Multi-Language Translation  ✅ 4 target languages       │
│  Local History Storage       ✅ AsyncStorage service     │
│  Session Management          ✅ CRUD operations          │
│  Backend Health Monitoring   ✅ Real-time status badge   │
│  Haptic Feedback             ✅ expo-haptics integration │
│  Platform-Specific Routing   ✅ Auto-detect URLs         │
│  Error Handling              ✅ Comprehensive coverage   │
│  TypeScript Type Safety      ✅ Full types throughout    │
│  Responsive Design           ✅ All screen sizes         │
│  Animation & UX              ✅ Pulse, fade, auto-scroll │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2024  
**Complexity**: Production-Ready
