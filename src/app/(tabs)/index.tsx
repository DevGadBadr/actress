import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActressCard } from '@/components/actress-card';
import { ActressIcon } from '@/components/actress-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteAgentData, fetchAgentData, toggleFavourite } from '@/lib/api';
import type { AgentData } from '@/types/agent-data';

const PAGE_SIZE = 8;

export default function HomeScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<AgentData[]>([]);
  const [cachedShuffleItems, setCachedShuffleItems] = useState<AgentData[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shuffleOnRefresh, setShuffleOnRefresh] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const applyClientPage = useCallback((allItems: AgentData[], targetPage: number) => {
    const pages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
    const safePage = Math.min(targetPage, pages);
    const start = (safePage - 1) * PAGE_SIZE;
    setItems(allItems.slice(start, start + PAGE_SIZE));
    setPage(safePage);
    setTotalPages(pages);
    setTotal(allItems.length);
  }, []);

  const loadPage = useCallback(
    async (targetPage: number, shuffle: boolean, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        if (shuffle) {
          const result = await fetchAgentData({
            page: 1,
            limit: PAGE_SIZE,
            shuffle: true,
          });
          setCachedShuffleItems(result.data);
          applyClientPage(result.data, targetPage);
        } else {
          setCachedShuffleItems(null);
          const result = await fetchAgentData({
            page: targetPage,
            limit: PAGE_SIZE,
            shuffle: false,
          });
          setItems(result.data);
          setPage(result.page);
          setTotalPages(result.totalPages);
          setTotal(result.total);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load actresses');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyClientPage],
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  const handleRefresh = useCallback(() => {
    loadPage(1, shuffleOnRefresh, true);
  }, [loadPage, shuffleOnRefresh]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    if (cachedShuffleItems) {
      applyClientPage(cachedShuffleItems, nextPage);
      return;
    }
    loadPage(nextPage, false);
  };

  const handleToggleFavourite = async (id: number) => {
    setBusyId(id);
    try {
      const updated = await toggleFavourite(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      setCachedShuffleItems((current) =>
        current?.map((item) => (item.id === id ? updated : item)) ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favourite');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      await deleteAgentData(id);
      if (cachedShuffleItems) {
        const nextCache = cachedShuffleItems.filter((item) => item.id !== id);
        setCachedShuffleItems(nextCache.length ? nextCache : null);
        applyClientPage(nextCache, Math.min(page, Math.max(1, Math.ceil(nextCache.length / PAGE_SIZE))));
      } else {
        const nextTotal = total - 1;
        const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
        const nextPage = Math.min(page, nextTotalPages);
        await loadPage(nextPage, false);
      }
      setBusyId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setBusyId(null);
    }
  };

  const paginationFooter = (
    <ThemedView type="backgroundElement" style={styles.pagination}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        disabled={page <= 1 || loading}
        onPress={() => goToPage(page - 1)}
        style={({ pressed }) => [
          styles.pageButton,
          (page <= 1 || loading) && styles.pageButtonDisabled,
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          size={14}
          tintColor={page <= 1 ? theme.textSecondary : theme.text}
        />
      </Pressable>

      <ThemedText themeColor="textSecondary" type="small" style={styles.pageLabel}>
        {page} / {totalPages}
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next page"
        disabled={page >= totalPages || loading}
        onPress={() => goToPage(page + 1)}
        style={({ pressed }) => [
          styles.pageButton,
          (page >= totalPages || loading) && styles.pageButtonDisabled,
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          tintColor={page >= totalPages ? theme.textSecondary : theme.text}
        />
      </Pressable>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View style={styles.profileRow}>
          <ThemedText themeColor="textSecondary" type="small">
            {total} {total === 1 ? 'profile' : 'profiles'}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh list"
            onPress={handleRefresh}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
              size={20}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        </View>

        <ThemedView type="backgroundElement" style={styles.toolbar}>
          <View style={styles.shuffleRow}>
            <SymbolView
              name={{ ios: 'shuffle', android: 'shuffle', web: 'shuffle' }}
              size={18}
              tintColor={shuffleOnRefresh ? '#7c5cff' : theme.textSecondary}
            />
            <ThemedText type="small">Shuffle on refresh</ThemedText>
          </View>
          <Switch
            value={shuffleOnRefresh}
            onValueChange={setShuffleOnRefresh}
            trackColor={{ false: theme.backgroundSelected, true: '#7c5cff' }}
            thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
          />
        </ThemedView>

        {error && (
          <ThemedView style={styles.errorBanner}>
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          </ThemedView>
        )}

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#7c5cff" />
            <ThemedText themeColor="textSecondary" type="small">
              Loading actresses…
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            contentInsetAdjustmentBehavior="automatic"
            style={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#7c5cff"
              />
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <ActressIcon size={64} />
                <ThemedText themeColor="textSecondary">No actresses yet</ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <ActressCard
                item={item}
                busy={busyId === item.id}
                onToggleFavourite={handleToggleFavourite}
                onDelete={handleDelete}
              />
            )}
            ListFooterComponent={paginationFooter}
          />
        )}
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
    paddingBottom: Spacing.three,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 16,
    marginBottom: Spacing.three,
  },
  shuffleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.two,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 10,
    marginTop: Spacing.three,
  },
  pageLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'center',
  },
  pageButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
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
