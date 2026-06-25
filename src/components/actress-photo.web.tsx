import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { resolveProxiedImageUrl } from '@/lib/api';

type Props = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  alt?: string;
  onError?: () => void;
};

export function ActressPhoto({ uri, style, alt, onError }: Props) {
  const [src, setSrc] = useState(uri);
  const [useProxy, setUseProxy] = useState(false);

  useEffect(() => {
    setSrc(uri);
    setUseProxy(false);
  }, [uri]);

  const handleError = () => {
    if (!useProxy) {
      setUseProxy(true);
      setSrc(resolveProxiedImageUrl(uri));
      return;
    }
    onError?.();
  };

  return (
    <View style={[styles.container, style]}>
      <img
        alt={alt ?? ''}
        src={src}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        style={styles.image}
        onError={handleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
});
