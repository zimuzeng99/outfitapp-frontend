import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocale } from '@/lib/i18n/locale-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useLocale();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.placeholder,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="tshirt.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stylist"
        options={{
          title: t('tabs.stylist'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="sparkles" color={color} />,
        }}
      />
    </Tabs>
  );
}
