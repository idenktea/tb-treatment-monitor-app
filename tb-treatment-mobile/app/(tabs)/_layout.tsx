import { Tabs } from 'expo-router';
import React from 'react';
import { Redirect } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  // Define role-specific tabs
  const getTabsForRole = () => {
    const commonTabs = [
      {
        name: 'index',
        title: 'Dashboard',
        icon: 'house.fill',
      },
    ];

    const roleSpecificTabs = {
      admin: [
        ...commonTabs,
        {
          name: 'users',
          title: 'Users',
          icon: 'person.2.fill',
        },
        {
          name: 'reports',
          title: 'Reports',
          icon: 'chart.bar.fill',
        },
      ],
      nurse: [
        ...commonTabs,
        {
          name: 'patients',
          title: 'Patients',
          icon: 'person.crop.circle.fill',
        },
        {
          name: 'registration',
          title: 'Register',
          icon: 'plus.circle.fill',
        },
        {
          name: 'reports',
          title: 'Reports',
          icon: 'chart.bar.fill',
        },
      ],
      doctor: [
        ...commonTabs,
        {
          name: 'patients',
          title: 'Patients',
          icon: 'person.crop.circle.fill',
        },
        {
          name: 'prescriptions',
          title: 'Prescriptions',
          icon: 'pills.fill',
        },
      ],
      pharmacist: [
        ...commonTabs,
        {
          name: 'inventory',
          title: 'Inventory',
          icon: 'cube.box.fill',
        },
        {
          name: 'dispensing',
          title: 'Dispensing',
          icon: 'cross.fill',
        },
      ],
      patient: [
        ...commonTabs,
        {
          name: 'medications',
          title: 'Medications',
          icon: 'pills.fill',
        },
        {
          name: 'adherence',
          title: 'Adherence',
          icon: 'camera.fill',
        },
        {
          name: 'symptoms',
          title: 'Symptoms',
          icon: 'heart.text.square.fill',
        },
      ],
      pmo: [
        ...commonTabs,
        {
          name: 'patients',
          title: 'Patients',
          icon: 'person.crop.circle.fill',
        },
        {
          name: 'adherence-review',
          title: 'Review',
          icon: 'checkmark.circle.fill',
        },
        {
          name: 'alerts',
          title: 'Alerts',
          icon: 'exclamationmark.triangle.fill',
        },
      ],
    };

    return roleSpecificTabs[user.role as keyof typeof roleSpecificTabs] || commonTabs;
  };

  const tabs = getTabsForRole();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
