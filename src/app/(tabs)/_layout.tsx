import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarHeight } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'top',
        lazy: true,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#7c5cff',
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          height: TabBarHeight + topInset,
          paddingTop: topInset,
          paddingBottom: 0,
          elevation: 0,
          ...Platform.select({
            web: { boxShadow: 'none' },
            default: { shadowOpacity: 0 },
          }),
          borderBottomWidth: 1,
          borderBottomColor: theme.backgroundElement,
        },
        tabBarItemStyle: {
          height: TabBarHeight,
          paddingVertical: 0,
        },
        sceneStyle: {
          backgroundColor: theme.background,
          paddingBottom: bottomInset,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Actresses',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: focused ? 'person.2.fill' : 'person.2',
                android: 'group',
                web: 'group',
              }}
              size={22}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              size={22}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
