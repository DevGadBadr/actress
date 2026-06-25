import { Image } from 'expo-image';
import { type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  alt?: string;
  recyclingKey?: string;
  onError?: () => void;
};

export function ActressPhoto({ uri, style, alt, recyclingKey, onError }: Props) {
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="cover"
      recyclingKey={recyclingKey}
      accessibilityLabel={alt}
      onError={onError}
    />
  );
}
