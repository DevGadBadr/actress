import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home_filled' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="generate">
        <Label>Generate</Label>
        <Icon
          sf={{ default: 'sparkles', selected: 'sparkles' }}
          md={{ default: 'auto_awesome', selected: 'auto_awesome' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
