import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sendAgentChat } from '@/lib/api';
import type { ChatMessage } from '@/types/chat';

type MessageRow = ChatMessage & { id: string };

function toRows(messages: ChatMessage[]): MessageRow[] {
  return messages.map((message, index) => ({
    ...message,
    id: `${index}-${message.role}`,
  }));
}

export default function GenerateScreen() {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<MessageRow>>(null);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setInput('');
    setError(null);
    setSending(true);

    const optimistic: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];
    setMessages(optimistic);

    try {
      const response = await sendAgentChat({
        message: trimmed,
        history: messages,
      });
      setMessages(response.messages);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (err) {
      setMessages(messages);
      setError(err instanceof Error ? err.message : 'Failed to reach the agent');
    } finally {
      setSending(false);
    }
  }, [input, messages, sending]);

  const rows = toRows(messages);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Generate
          </ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Ask for actresses by movie, theme, or era
          </ThemedText>
        </View>

        {error && (
          <ThemedView style={styles.errorBanner}>
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          </ThemedView>
        )}

        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={48}
                tintColor={theme.textSecondary}
              />
              <ThemedText themeColor="textSecondary" style={styles.emptyTitle}>
                Describe who you want to find
              </ThemedText>
              <ThemedText themeColor="textSecondary" type="small" style={styles.emptyHint}>
                Try “actress from a 90s sci-fi movie” or “modern action heroine with red hair”.
                New profiles are saved automatically and appear on Home.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                style={[
                  styles.bubbleRow,
                  isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
                ]}>
                <ThemedView
                  type={isUser ? undefined : 'backgroundElement'}
                  style={[
                    styles.bubble,
                    isUser && styles.bubbleUser,
                    !isUser && { backgroundColor: theme.backgroundElement },
                  ]}>
                  <ThemedText
                    selectable
                    style={isUser ? styles.bubbleTextUser : undefined}>
                    {item.content}
                  </ThemedText>
                </ThemedView>
              </View>
            );
          }}
        />

        {sending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#7c5cff" />
            <ThemedText themeColor="textSecondary" type="small">
              Searching and saving…
            </ThemedText>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
          <ThemedView type="backgroundElement" style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Tell the agent what to find…"
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={2000}
              style={[styles.input, { color: theme.text }]}
              editable={!sending}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!input.trim() || sending}
              onPress={handleSend}
              style={({ pressed }) => [
                styles.sendButton,
                (!input.trim() || sending) && styles.sendButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'arrow.up.circle.fill', android: 'send', web: 'send' }}
                size={32}
                tintColor={!input.trim() || sending ? theme.textSecondary : '#7c5cff'}
              />
            </Pressable>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
  },
  header: {
    gap: 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
    lineHeight: 20,
  },
  bubbleRow: {
    width: '100%',
  },
  bubbleRowUser: {
    alignItems: 'flex-end',
  },
  bubbleRowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bubbleUser: {
    backgroundColor: '#7c5cff',
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    borderRadius: 20,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorBanner: {
    backgroundColor: '#3a1515',
    borderRadius: 12,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  errorText: {
    color: '#ffb4b4',
  },
  pressed: {
    opacity: 0.75,
  },
});
