import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActressIcon } from '@/components/actress-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sendAgentChat } from '@/lib/api';
import type { ChatMessage } from '@/types/chat';

type MessageRow = ChatMessage & { id: string };

const CHAR_COUNT_THRESHOLD = 1800;
const MAX_INPUT_LENGTH = 2000;

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
  const inputRef = useRef<TextInput>(null);

  const listHeader = (
    <View>
      <ThemedText themeColor="textSecondary" type="small" style={styles.subtitle}>
        Ask for actresses by movie, theme, or era
      </ThemedText>
      {error ? (
        <ThemedView style={styles.errorBanner}>
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        </ThemedView>
      ) : null}
    </View>
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const previousMessages = messages;
    setError(null);
    setSending(true);
    setInput('');

    const optimistic: ChatMessage[] = [
      ...previousMessages,
      { role: 'user', content: trimmed },
    ];
    setMessages(optimistic);

    try {
      const response = await sendAgentChat({
        message: trimmed,
        history: previousMessages,
      });
      setMessages(response.messages);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (err) {
      setMessages(previousMessages);
      setInput(trimmed);
      setError(err instanceof Error ? err.message : 'Failed to reach the agent');
    } finally {
      setSending(false);
    }
  }, [input, messages, sending]);

  const handleWebInputKeyDown = useCallback(
    (event: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  const handleInputFocus = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleBodyPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const rows = toRows(messages);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <KeyboardAvoidingView style={styles.keyboardAvoid} behavior="padding">
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
            ListHeaderComponent={listHeader}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <Pressable style={styles.emptyState} onPress={handleBodyPress}>
                <ActressIcon size={64} />
                <ThemedText themeColor="textSecondary" style={styles.emptyTitle}>
                  Describe who you want to find
                </ThemedText>
                <ThemedText themeColor="textSecondary" type="small" style={styles.emptyHint}>
                  Try “actress from a 90s sci-fi movie” or “modern action heroine with red hair”.
                  New profiles are saved automatically and appear on Home.
                </ThemedText>
              </Pressable>
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

          <View style={styles.footer}>
            {sending && (
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={Accent} />
                <ThemedText themeColor="textSecondary" type="small">
                  Searching and saving…
                </ThemedText>
              </View>
            )}

            <ThemedView type="backgroundElement" style={styles.composer}>
              <View style={styles.inputColumn}>
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Tell the agent what to find…"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  maxLength={MAX_INPUT_LENGTH}
                  style={[styles.input, { color: theme.text }]}
                  editable={!sending}
                  returnKeyType="send"
                  submitBehavior={Platform.OS === 'ios' ? 'submit' : undefined}
                  accessibilityLabel="Search query"
                  accessibilityHint="Describe an actress by movie, theme, or era, then send your message"
                  onFocus={handleInputFocus}
                  onSubmitEditing={handleSend}
                  {...(Platform.OS === 'web' ? { onKeyDown: handleWebInputKeyDown } : {})}
                  blurOnSubmit={false}
                />
                {input.length >= CHAR_COUNT_THRESHOLD && (
                  <ThemedText themeColor="textSecondary" type="small" style={styles.charCount}>
                    {input.length}/{MAX_INPUT_LENGTH}
                  </ThemedText>
                )}
              </View>
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
                  tintColor={!input.trim() || sending ? theme.textSecondary : Accent}
                />
              </Pressable>
            </ThemedView>
          </View>
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
  keyboardAvoid: {
    flex: 1,
  },
  footer: {
    paddingTop: Spacing.two,
  },
  subtitle: {
    paddingBottom: Spacing.three,
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
    backgroundColor: Accent,
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
  },
  inputColumn: {
    flex: 1,
  },
  input: {
    width: '100%',
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'top' as const } : {}),
  },
  charCount: {
    textAlign: 'right',
    paddingTop: Spacing.half,
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
