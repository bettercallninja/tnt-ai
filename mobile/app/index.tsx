import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  FlatList,
  View,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  useColorScheme,
  Switch,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

import { recordSpeech } from '@/functions/recordSpeech';
import useWebFocus from '@/hooks/useWebFocus';
import { Message, Session } from '@/types';
import { StorageService } from '@/services/storage';
import { BackendAPI } from '@/services/api';
import { MessageBubble } from '@/components/MessageBubble';
import { HistorySidebar } from '@/components/HistorySidebar';

export default function HomeScreen() {
  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [backendOnline, setBackendOnline] = useState(false);
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Refs
  const audioRecordingRef = useRef(new Audio.Recording());
  const webAudioPermissionsRef = useRef<MediaStream | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const isWebFocused = useWebFocus();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    checkBackendHealth();
  }, []);

  // Web audio permissions
  useEffect(() => {
    if (isWebFocused) {
      const getMicAccess = async () => {
        try {
          const permissions = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          webAudioPermissionsRef.current = permissions;
        } catch (error) {
          console.error('Microphone permission denied:', error);
        }
      };
      if (!webAudioPermissionsRef.current) getMicAccess();
    } else {
      if (webAudioPermissionsRef.current) {
        webAudioPermissionsRef.current
          .getTracks()
          .forEach((track) => track.stop());
        webAudioPermissionsRef.current = null;
      }
    }
  }, [isWebFocused]);

  // Pulse animation for recording - world-class spring physics
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.spring(pulseAnim, {
            toValue: 1.4,
            tension: 20,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(pulseAnim, {
            toValue: 1,
            tension: 20,
            friction: 3,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.spring(pulseAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording]);

  // Auto-scroll to bottom when new message
  useEffect(() => {
    if (activeSession && activeSession.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeSession?.messages.length]);

  const checkBackendHealth = async () => {
    const isOnline = await BackendAPI.healthCheck();
    setBackendOnline(isOnline);
  };

  const loadSessions = async () => {
    const loadedSessions = await StorageService.getSessions();
    setSessions(loadedSessions);

    const activeId = await StorageService.getActiveSessionId();
    if (activeId) {
      const session = loadedSessions.find(s => s.id === activeId);
      setActiveSession(session || null);
    }

    if (!activeId || !loadedSessions.find(s => s.id === activeId)) {
      createNewSession();
    }
  };

  const createNewSession = () => {
    const newSession = StorageService.createNewSession();
    setActiveSession(newSession);
    StorageService.setActiveSessionId(newSession.id);
    StorageService.saveSession(newSession);
    setSessions(prev => [newSession, ...prev]);
  };

  const saveCurrentSession = async (updatedSession: Session) => {
    await StorageService.saveSession(updatedSession);
    setSessions(prev =>
      prev.map(s => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const handleStartRecording = async () => {
    if (!backendOnline) {
      Alert.alert(
        'Backend Offline',
        'The transcription server is not available. Please ensure the backend is running at ' + BackendAPI.baseUrl,
        [{ text: 'OK' }]
      );
      return;
    }

    if (isProcessing) {
      Alert.alert('Please Wait', 'Previous recording is still processing.');
      return;
    }

    try {
      // Clear any previous errors
      setRecordingError(null);
      
      // Check and request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone permission in your device settings to use voice recording.'
        );
        return;
      }

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Button press animation
      Animated.spring(buttonScaleAnim, {
        toValue: 0.95,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }).start();

      // Cleanup any existing recording
      try {
        const status = await audioRecordingRef.current.getStatusAsync();
        if (status.isRecording) {
          console.log('⚠️ Cleaning up previous recording...');
          await audioRecordingRef.current.stopAndUnloadAsync();
        }
      } catch (e) {
        // Ignore - no recording to clean up
      }

      // Create fresh recording instance
      audioRecordingRef.current = new Audio.Recording();
      
      // Start recording
      await recordSpeech(
        audioRecordingRef,
        setIsRecording,
        !!webAudioPermissionsRef.current
      );
      
      console.log('✅ Recording started successfully');
    } catch (error: any) {
      console.error('❌ Failed to start recording:', error);
      setIsRecording(false);
      setRecordingError(error.message);
      
      // Reset button animation
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }).start();
      
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.\n\nError: ' + error.message,
        [{ text: 'OK' }]
      );
    }
  };

  const handleStopRecording = async () => {
    if (!activeSession) return;

    setIsRecording(false);
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Reset button animation
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();

    try {
      // Validate recording exists and is active
      const recordingStatus = await audioRecordingRef?.current?.getStatusAsync();
      
      if (!recordingStatus) {
        throw new Error('No recording instance found');
      }
      
      if (!recordingStatus.isRecording) {
        throw new Error('No active recording found - recording may not have started properly');
      }

      console.log('⏹️ Stopping recording...');
      
      // Stop recording
      await audioRecordingRef?.current?.stopAndUnloadAsync();
      const recordingUri = audioRecordingRef?.current?.getURI() || '';
      
      if (!recordingUri) {
        throw new Error('Recording failed to save - no audio file created');
      }

      console.log('✅ Recording stopped, URI:', recordingUri);

      // Reset audio mode AFTER stopping
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      // Create optimistic user message with loading state
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'user',
        audioUri: recordingUri,
        targetLanguage,
        timestamp: Date.now(),
        isLoading: true,
      };

      const updatedSession = {
        ...activeSession,
        messages: [...activeSession.messages, userMessage],
        updatedAt: Date.now(),
      };
      setActiveSession(updatedSession);

      // Validate recording URI
      console.log('� Recording URI:', recordingUri);

      // Call backend API directly with URI (React Native FormData handles file reading)
      console.log('🚀 Sending to backend...');
      const response = await BackendAPI.transcribeAndTranslate(
        recordingUri,
        targetLanguage
      );

      console.log('✅ Received transcription:', response);

      // Update user message with results
      const completedUserMessage: Message = {
        ...userMessage,
        transcript: response.transcript,
        translation: response.translation,
        detectedLanguage: response.source_lang || response.lang || 'unknown',
        isLoading: false,
      };

      const finalSession = {
        ...updatedSession,
        messages: updatedSession.messages.map(m =>
          m.id === userMessage.id ? completedUserMessage : m
        ),
        title: response.transcript.substring(0, 30) + '...',
        updatedAt: Date.now(),
      };

      setActiveSession(finalSession);
      await saveCurrentSession(finalSession);

      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error: any) {
      console.error('❌ Transcription error:', error);

      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'user',
        targetLanguage,
        timestamp: Date.now(),
        error: error.message || 'Failed to process audio',
      };

      const errorSession = {
        ...activeSession,
        messages: [...activeSession.messages.filter(m => !m.isLoading), errorMessage],
        updatedAt: Date.now(),
      };

      setActiveSession(errorSession);
      await saveCurrentSession(errorSession);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Processing Error',
        error.message || 'Failed to process audio',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      // Create fresh recording instance for next recording
      audioRecordingRef.current = new Audio.Recording();
      console.log('🔄 Ready for next recording');
    }
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
      StorageService.setActiveSessionId(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));

            if (activeSession?.id === sessionId) {
              createNewSession();
            }
          },
        },
      ]
    );
  };

  const languages = ['English', 'Turkish', 'Persian', 'Arabic'];

  // Dynamic theme colors
  const theme = {
    bg: isDarkMode ? '#000000' : '#FFFFFF',
    headerBg: isDarkMode ? '#1C1C1E' : '#F8F8F8',
    cardBg: isDarkMode ? '#2C2C2E' : '#FFFFFF',
    border: isDarkMode ? '#38383A' : '#E0E0E0',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#98989D' : '#666666',
    textTertiary: isDarkMode ? '#636366' : '#999999',
    primary: '#2e2d80ff',
    success: '#4CAF50',
    error: '#FF3B30',
    emptyIcon: isDarkMode ? '#3A3A3C' : '#E0E0E0',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header with proper padding for notch/island */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        >
          <FontAwesome name="bars" size={24} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>TNT AI</Text>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: backendOnline ? theme.success : theme.error },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {backendOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Dark Mode Toggle */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <FontAwesome 
              name={isDarkMode ? 'sun-o' : 'moon-o'} 
              size={20} 
              color={theme.textSecondary} 
            />
          </TouchableOpacity>

          {/* New Chat Button */}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={createNewSession}
          >
            <FontAwesome name="plus" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selector */}
      <Animated.View style={[styles.languageSelector, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <Text style={[styles.languageLabel, { color: theme.textSecondary }]}>Translate to:</Text>
        <View style={styles.languageButtons}>
          {languages.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageButton,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                targetLanguage === lang && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => {
                setTargetLanguage(lang);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  { color: theme.text },
                  targetLanguage === lang && { color: '#FFFFFF' },
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={[styles.messagesContainer, { backgroundColor: theme.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {activeSession && activeSession.messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={activeSession.messages}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isDarkMode={isDarkMode}
                onPlayAudio={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  console.log('Play audio:', item.audioUri);
                }}
              />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome name="microphone" size={80} color={theme.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Start Speaking</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>
              Press and hold the microphone button to record
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>
              Your speech will be transcribed and translated
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Recording Button */}
      <View style={[styles.recordingContainer, { backgroundColor: theme.headerBg, borderTopColor: theme.border }]}>
        {isProcessing && (
          <Animated.View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.processingText, { color: theme.primary }]}>
              Processing with AI... Please wait
            </Text>
          </Animated.View>
        )}

        <Animated.View style={{ 
          transform: [
            { scale: Animated.multiply(pulseAnim, buttonScaleAnim) }
          ] 
        }}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              { backgroundColor: theme.primary },
              isRecording && styles.recordButtonActive,
              (isProcessing || !backendOnline) && styles.recordButtonDisabled,
            ]}
            onPressIn={handleStartRecording}
            onPressOut={handleStopRecording}
            disabled={isProcessing || !backendOnline}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <View style={styles.recordingIndicator}>
                <Animated.View 
                  style={[
                    styles.recordingDot,
                    { transform: [{ scale: pulseAnim }] }
                  ]} 
                />
              </View>
            ) : (
              <FontAwesome name="microphone" size={32} color="white" />
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.recordHint, { color: theme.textSecondary }]}>
          {isRecording
            ? '🔴 Recording... Release to stop'
            : backendOnline
            ? '🎤 Hold to record'
            : '⚠️ Backend offline - Check connection'}
        </Text>
      </View>

      {/* History Sidebar */}
      <HistorySidebar
        visible={showHistory}
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        isDarkMode={isDarkMode}
        onClose={() => setShowHistory(false)}
        onSelectSession={handleSelectSession}
        onNewSession={createNewSession}
        onDeleteSession={handleDeleteSession}
      />
    </SafeAreaView>
  );
}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 0 : 0, // SafeAreaView handles this
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: (RNStatusBar.currentHeight || 0) + 16, // Dynamic: Uses actual status bar height + 16px spacing
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  historyButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  newChatButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  languageButtonActive: {
    backgroundColor: '#2e2d80ff',
    borderColor: '#2e2d80ff',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  processingText: {
    fontSize: 14,
    color: '#2e2d80ff',
    fontWeight: '500',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2e2d80ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
  },
  recordButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  recordingIndicator: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
