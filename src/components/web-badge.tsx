import { StyleSheet } from 'react-native';

import { ActressIcon } from '@/components/actress-icon';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function WebBadge() {
  return (
    <ThemedView style={styles.container}>
      <ActressIcon size={16} />
      <ThemedText type="small" themeColor="textSecondary">
        Actress
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
