export const ACTRESS_ICON_SOURCES = {
  16: require('@/assets/images/icons8-actress-16.png'),
  64: require('@/assets/images/icons8-actress-64.png'),
  100: require('@/assets/images/icons8-actress-100.png'),
} as const;

export type ActressIconAssetSize = keyof typeof ACTRESS_ICON_SOURCES;

export function pickActressIconSource(displaySize: number) {
  if (displaySize <= 16) {
    return ACTRESS_ICON_SOURCES[16];
  }
  if (displaySize <= 64) {
    return ACTRESS_ICON_SOURCES[64];
  }
  return ACTRESS_ICON_SOURCES[100];
}
