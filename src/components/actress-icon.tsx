import { Image, type ImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';

import { pickActressIconSource } from '@/constants/actress-icons';

type Props = Omit<ImageProps, 'source'> & {
  size: number;
};

export function ActressIcon({ size, style, ...rest }: Props) {
  return (
    <Image
      source={pickActressIconSource(size)}
      style={[styles.icon, { width: size, height: size }, style]}
      contentFit="contain"
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    flexShrink: 0,
  },
});
