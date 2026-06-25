import { SymbolView } from 'expo-symbols';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ActressIcon } from '@/components/actress-icon';
import { ActressPhoto } from '@/components/actress-photo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AgentData } from '@/types/agent-data';

type Props = {
  item: AgentData;
  onToggleFavourite: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

async function openGoogleSearch(name: string) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(name)}`;
  await Linking.openURL(url);
}

export const ActressCard = memo(function ActressCard({
  item,
  onToggleFavourite,
  onDelete,
}: Props) {
  const theme = useTheme();
  const name = item.actress_name?.trim() || 'Unknown';
  const openingRef = useRef(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [pendingAction, setPendingAction] = useState<'favourite' | 'delete' | null>(null);

  useEffect(() => {
    setImageFailed(false);
  }, [item.actress_pic_url]);

  const handleImagePress = useCallback(() => {
    if (openingRef.current) return;
    openingRef.current = true;
    void openGoogleSearch(name).finally(() => {
      openingRef.current = false;
    });
  }, [name]);

  const handleToggleFavourite = useCallback(() => {
    setPendingAction('favourite');
    void onToggleFavourite(item.id).finally(() => {
      setPendingAction(null);
    });
  }, [item.id, onToggleFavourite]);

  const handleDelete = useCallback(() => {
    setPendingAction('delete');
    void onDelete(item.id).finally(() => {
      setPendingAction(null);
    });
  }, [item.id, onDelete]);

  const busy = pendingAction !== null;
  const deleting = pendingAction === 'delete';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Search ${name} on Google`}
        onPress={handleImagePress}
        style={[styles.imageWrap, { backgroundColor: theme.backgroundSelected }]}>
        {item.actress_pic_url && !imageFailed ? (
          <ActressPhoto
            uri={item.actress_pic_url}
            style={styles.image}
            alt={name}
            recyclingKey={String(item.id)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <ActressIcon size={48} />
          </View>
        )}
        {item.favourite && (
          <View style={styles.favBadge}>
            <SymbolView
              name={{ ios: 'star.fill', android: 'star', web: 'star' }}
              size={12}
              tintColor="#f5c518"
            />
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={2} style={styles.name}>
          {name}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.favourite ? 'Remove from favourites' : 'Add to favourites'}
            disabled={busy}
            onPress={handleToggleFavourite}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: item.favourite ? '#3d2f00' : theme.backgroundSelected },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{
                ios: item.favourite ? 'star.fill' : 'star',
                android: 'star',
                web: 'star',
              }}
              size={18}
              tintColor={item.favourite ? '#f5c518' : theme.textSecondary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete actress"
            disabled={busy}
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: '#3a1515' },
              pressed && styles.pressed,
            ]}>
            {deleting ? (
              <ActivityIndicator size="small" color="#ff6b6b" />
            ) : (
              <SymbolView
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                size={18}
                tintColor="#ff6b6b"
              />
            )}
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
    minWidth: 150,
    maxWidth: '48%',
    marginBottom: Spacing.three,
  },
  imageWrap: {
    position: 'relative',
    aspectRatio: 3 / 4,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    padding: 6,
  },
  body: {
    padding: Spacing.two,
    gap: Spacing.two,
  },
  name: {
    minHeight: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
