import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AgentData } from '@/types/agent-data';

type Props = {
  item: AgentData;
  onToggleFavourite: (id: number) => void;
  onDelete: (id: number) => void;
  busy?: boolean;
};

export function ActressCard({ item, onToggleFavourite, onDelete, busy }: Props) {
  const theme = useTheme();
  const name = item.actress_name?.trim() || 'Unknown';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.imageWrap}>
        {item.actress_pic_url ? (
          <Image
            source={{ uri: item.actress_pic_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView
              name={{ ios: 'person.fill', android: 'person', web: 'person' }}
              size={40}
              tintColor={theme.textSecondary}
            />
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
      </View>

      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={2} style={styles.name}>
          {name}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.favourite ? 'Remove from favourites' : 'Add to favourites'}
            disabled={busy}
            onPress={() => onToggleFavourite(item.id)}
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
            onPress={() => onDelete(item.id)}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: '#3a1515' },
              pressed && styles.pressed,
            ]}>
            {busy ? (
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
}

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
