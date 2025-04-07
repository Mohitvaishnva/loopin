import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme, View, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddComplaintScreen from '../screens/AddComplaintScreen';
import Community from '../screens/Community';

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Dark theme colors
  const darkColors = {
    primary: '#BB86FC', // Purple accent color for dark theme
    inactive: '#9E9E9E', // Light gray for inactive items
    background: '#121212', // Dark background
    card: '#1E1E1E', // Slightly lighter dark for cards
    text: '#FFFFFF', // White text
    border: '#2C2C2C', // Dark border
  };

  // Light theme colors (for reference, though we're focusing on dark)
  const lightColors = {
    primary: '#4A148C',
    inactive: 'gray',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E0E0E0',
  };

  // Use dark colors regardless of system preference
  const colors = darkColors;

  // Screen options with dark background
  const screenOptions = {
    headerShown: false,
    contentStyle: {
      backgroundColor: colors.background,
    },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          let IconComponent = Ionicons;
          
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Add') {
            iconName = 'plus';
            IconComponent = MaterialCommunityIcons;
          } else if (route.name === 'Community') {
            iconName = 'account-group';
            IconComponent = MaterialCommunityIcons;
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          
          return <IconComponent name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFFFFF', // White for active icons
        tabBarInactiveTintColor: '#A0A0A0', // Light gray for inactive icons
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          color: colors.text, // This will use the white text color from darkColors
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        sceneContainerStyle: {
          backgroundColor: colors.background,
        },
      })}
      theme={{
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
        dark: true,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={screenOptions}
      />
      <Tab.Screen 
        name="Add" 
        component={AddComplaintScreen} 
        options={screenOptions}
      />
      <Tab.Screen 
        name="Community" 
        component={Community} 
        options={screenOptions}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={screenOptions}
      />
    </Tab.Navigator>
  );
}