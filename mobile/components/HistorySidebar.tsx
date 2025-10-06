import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Session } from '@/types';
import { FontAwesome } from '@expo/vector-icons';

interface HistorySidebarProps {
  visible: boolean;
  sessions: Session[];
  activeSessionId: string | null;
  isDarkMode?: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  visible,
  sessions,
  activeSessionId,
  isDarkMode = false,
  onClose,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}) => {
  // Dynamic theme colors
  const theme = {
    bg: isDarkMode ? '#000000' : '#FFFFFF',
    cardBg: isDarkMode ? '#1C1C1E' : '#F8F8F8',
    border: isDarkMode ? '#38383A' : '#E0E0E0',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#98989D' : '#666666',
    primary: '#2e2d80ff',
    activeBg: isDarkMode ? '#2e2d80ff20' : '#2e2d80ff10',
    error: '#FF3B30',
  };

  const renderSession = ({ item }: { item: Session }) => {
    const isActive = item.id === activeSessionId;
    const messageCount = item.messages.length;
    
    return (
      <TouchableOpacity
        style={[
          styles.sessionItem,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isActive && { backgroundColor: theme.activeBg, borderColor: theme.primary },
        ]}
        onPress={() => {
          onSelectSession(item.id);
          onClose();
        }}
      >
        <View style={styles.sessionContent}>
          <Text style={[styles.sessionTitle, { color: theme.text }, isActive && { color: theme.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.sessionInfo, { color: theme.textSecondary }]}>
            {messageCount} message{messageCount !== 1 ? 's' : ''} • {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeleteSession(item.id)}
        >
          <FontAwesome name="trash-o" size={18} color={theme.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Chat History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.newChatButton, { backgroundColor: theme.primary }]} onPress={() => {
          onNewSession();
          onClose();
        }}>
          <FontAwesome name="plus" size={20} color="#fff" />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>

        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="comments-o" size={64} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No chat history yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Start a new conversation to begin</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e2d80ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  newChatText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeSession: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2e2d80ff',
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  activeText: {
    color: '#2e2d80ff',
  },
  sessionInfo: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
  },
});
