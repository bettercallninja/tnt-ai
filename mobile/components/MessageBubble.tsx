import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Message } from '@/types';
import { FontAwesome } from '@expo/vector-icons';

// Skeleton Loading Component
const SkeletonLine: React.FC<{ width: string; isDarkMode: boolean; delay?: number }> = ({ width, isDarkMode, delay = 0 }) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false, // Can't use native driver for opacity
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }, delay);
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeletonLine,
        {
          width: width as any, // Type assertion for percentage string
          backgroundColor: isDarkMode ? '#3A3A3C' : '#E0E0E0',
          opacity,
        },
      ]}
    />
  );
};

interface MessageBubbleProps {
  message: Message;
  isDarkMode?: boolean;
  onPlayAudio?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isDarkMode = false,
  onPlayAudio,
}) => {
  const isUser = message.type === 'user';
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    // World-class entrance animation: fade + slide + scale with spring
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Dynamic theme colors
  const theme = {
    userBg: '#2e2d80ff',
    assistantBg: isDarkMode ? '#2C2C2E' : '#F0F0F0',
    userText: '#FFFFFF',
    assistantText: isDarkMode ? '#FFFFFF' : '#000000',
    borderColor: isDarkMode ? '#38383A' : '#E0E0E0',
    metaText: isDarkMode ? '#98989D' : '#666666',
    errorBg: isDarkMode ? '#3A1A1A' : '#FFE5E5',
    errorText: '#FF3B30',
  };

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.assistantMessage,
        { 
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Audio Icon */}
      {message.audioUri && (
        <TouchableOpacity
          style={styles.audioIcon}
          onPress={onPlayAudio}
        >
          <FontAwesome name="volume-up" size={16} color={isUser ? '#fff' : theme.metaText} />
        </TouchableOpacity>
      )}

      {/* Transcript */}
      {message.transcript && (
        <View style={styles.textSection}>
          <Text style={[styles.label, { color: isUser ? '#FFFFFF' : theme.metaText }]}>
            {isUser ? '🎤 You said:' : '📝 Transcript:'}
          </Text>
          <Text style={[styles.text, { color: isUser ? theme.userText : theme.assistantText }]}>
            {message.transcript}
          </Text>
        </View>
      )}

      {/* Loading State - Skeleton */}
      {message.isLoading && !message.transcript && (
        <View style={styles.textSection}>
          <Text style={[styles.label, { color: isUser ? '#FFFFFF' : theme.metaText }]}>
            🤖 AI is processing...
          </Text>
          <View style={styles.skeletonContainer}>
            <SkeletonLine width="90%" isDarkMode={isDarkMode} delay={0} />
            <SkeletonLine width="75%" isDarkMode={isDarkMode} delay={100} />
            <SkeletonLine width="85%" isDarkMode={isDarkMode} delay={200} />
          </View>
        </View>
      )}

      {/* Translation */}
      {message.translation && (
        <View style={[styles.textSection, styles.translationSection, { borderTopColor: theme.borderColor }]}>
          <Text style={[styles.label, { color: isUser ? '#FFFFFF' : theme.metaText }]}>
            🌍 Translation ({message.targetLanguage}):
          </Text>
          <Text style={[styles.text, styles.translationText, { color: isUser ? theme.userText : theme.assistantText }]}>
            {message.translation}
          </Text>
        </View>
      )}

      {/* Detected Language */}
      {message.detectedLanguage && (
        <Text style={[styles.metadata, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.metaText }]}>
          Detected: {message.detectedLanguage}
        </Text>
      )}

      {/* Error */}
      {message.error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.errorBg }]}>
          <Text style={[styles.errorText, { color: theme.errorText }]}>⚠️ {message.error}</Text>
        </View>
      )}

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.metaText }]}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '85%',
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
    position: 'relative',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2e2d80ff',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  audioIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  textSection: {
    marginBottom: 8,
  },
  translationSection: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
    color: '#000',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  userText: {
    color: '#fff',
  },
  translationText: {
    fontStyle: 'italic',
  },
  metadata: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
    color: '#000',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    opacity: 0.5,
    textAlign: 'right',
    color: '#000',
  },
  skeletonContainer: {
    marginTop: 4,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
    marginVertical: 3,
  },
});
