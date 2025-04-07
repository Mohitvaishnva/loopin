// StackNavigation.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '..screens/HomeScreen';
import ComplaintScreen from '../screens/AddComplaintScreen';
import ProfileScreen from '../screens/ProfileScreen';
import add from '../screens/Add';
import Addpost from '../screens/Addpost';
const Stack = createStackNavigator();

export default function MaidStackNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="Complaint" component={ComplaintScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Add" component={add} />
        <Stack.Screen name="Addpost" component={Addpost} />
        
        
        

    </Stack.Navigator>  
  );
}
































