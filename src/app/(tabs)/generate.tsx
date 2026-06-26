import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
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
const INPUT_LINE_HEIGHT = 22;
const MAX_INPUT_HEIGHT = 120;
const SEND_BUTTON_SIZE = 40;
const MULTILINE_HEIGHT_THRESHOLD = INPUT_LINE_HEIGHT + 4;

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputContentHeight, setInputContentHeight] = useState(INPUT_LINE_HEIGHT);
  const listRef = useRef<FlatList<MessageRow>>(null);
  const inputRef = useRef<TextInput>(null);

  const isMultilineInput =
    input.includes('\n') || inputContentHeight > MULTILINE_HEIGHT_THRESHOLD;

  useEffect(() => {
    if (Platform.OS === 'web') {
      inputRef.current?.focus();
    }
  }, []);

  const listHeader = (
    <View>
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
    setInputContentHeight(INPUT_LINE_HEIGHT);

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

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    if (!text) {
      setInputContentHeight(INPUT_LINE_HEIGHT);
    }
  }, []);

  const handleInputContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const nextHeight = Math.min(
        MAX_INPUT_HEIGHT,
        Math.max(INPUT_LINE_HEIGHT, event.nativeEvent.contentSize.height),
      );
      setInputContentHeight(nextHeight);
    },
    [],
  );

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  const handleBodyPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const rows = toRows(messages);
  const isEmpty = messages.length === 0;

  const composer = (
    <View style={styles.footer}>
      {sending && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={Accent} />
          <ThemedText themeColor="textSecondary" type="small">
            Searching and saving…
          </ThemedText>
        </View>
      )}

      <ThemedView
        type="backgroundElement"
        style={[
          styles.composer,
          isMultilineInput && styles.composerMultiline,
          Platform.OS === 'web' && isInputFocused && styles.composerFocused,
        ]}>
        <View
          style={[
            styles.inputColumn,
            isMultilineInput && styles.inputColumnMultiline,
          ]}>
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={handleInputChange}
            placeholder="Tell the agent what to find…"
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={MAX_INPUT_LENGTH}
            scrollEnabled={inputContentHeight >= MAX_INPUT_HEIGHT}
            onContentSizeChange={handleInputContentSizeChange}
            style={[
              styles.input,
              { color: theme.text, height: inputContentHeight },
              isMultilineInput && styles.inputMultiline,
            ]}
            editable={!sending}
            returnKeyType="send"
            submitBehavior={
              Platform.OS === 'ios' || Platform.OS === 'web' ? 'submit' : undefined
            }
            accessibilityLabel="Search query"
            accessibilityHint="Describe an actress by movie, theme, or era, then send your message"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onSubmitEditing={handleSend}
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
            Platform.OS === 'web' &&
              (!input.trim() || sending
                ? styles.sendButtonCursorDisabled
                : styles.sendButtonCursor),
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
      {Platform.OS === 'web' && (
        <ThemedText themeColor="textSecondary" type="small" style={styles.keyboardHint}>
          Enter to send
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <KeyboardAvoidingView style={styles.keyboardAvoid} behavior="padding">
          {isEmpty ? (
            <View style={styles.emptyContainer}>
              <Pressable style={styles.emptyState} onPress={handleBodyPress}>
                {error ? (
                  <ThemedView style={styles.errorBanner}>
                    <ThemedText type="small" style={styles.errorText}>
                      {error}
                    </ThemedText>
                  </ThemedView>
                ) : null}
                <ActressIcon size={64} />
                <ThemedText themeColor="textSecondary" style={styles.emptyTitle}>
                  Describe who you want to find
                </ThemedText>
              </Pressable>
              {composer}
            </View>
          ) : (
            <>
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
              {composer}
            </>
          )}
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
    ...Platform.select({
      web: { paddingBottom: Spacing.three },
      default: {},
    }),
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
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
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 20,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: SEND_BUTTON_SIZE + Spacing.two * 2,
  },
  composerMultiline: {
    alignItems: 'flex-end',
  },
  composerFocused: {
    borderWidth: 1,
    borderColor: Accent,
  },
  inputColumn: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  inputColumnMultiline: {
    justifyContent: 'flex-end',
  },
  input: {
    width: '100%',
    fontSize: 16,
    lineHeight: INPUT_LINE_HEIGHT,
    textAlign: 'left',
    paddingVertical: 0,
    ...Platform.select({
      android: {
        textAlignVertical: 'center' as const,
      },
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
        backgroundColor: 'transparent',
        resize: 'none',
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        fontFamily: 'var(--font-display)',
      },
      default: {
        paddingTop: 0,
        paddingBottom: 0,
      },
    }),
  },
  inputMultiline: {
    ...Platform.select({
      android: {
        textAlignVertical: 'top' as const,
      },
      default: {},
    }),
  },
  keyboardHint: {
    textAlign: 'center',
    paddingTop: Spacing.one,
  },
  charCount: {
    textAlign: 'right',
    paddingTop: Spacing.half,
  },
  sendButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonCursor: {
    cursor: 'pointer',
  },
  sendButtonCursorDisabled: {
    cursor: 'not-allowed',
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
