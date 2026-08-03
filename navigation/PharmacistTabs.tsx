import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { PharmacistTabParamList } from './types'
import PharmacistHome from '../app/(pharmacist)/index'
import AddItemsScreen from '../app/(pharmacist)/add-items'
import PharmacistOrders from '../app/(pharmacist)/orders'
import PharmacistMessages from '../app/(pharmacist)/messages'
import PharmacistProfile from '../app/(pharmacist)/profile'
import { useChat } from '../context/ChatContext'

const Tab = createBottomTabNavigator<PharmacistTabParamList>()

const PharmacistTabs: React.FC = () => {
  const { unreadCount } = useChat()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline'
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'AddItems') {
            iconName = focused ? 'add-circle' : 'add-circle-outline'
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline'
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }
          
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#2C7A7B',
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={PharmacistHome}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="AddItems" 
        component={AddItemsScreen}
        options={{ title: 'Add Items' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={PharmacistOrders}
        options={{ 
          title: 'Orders',
          tabBarBadge: 0, // You can add order count here
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={PharmacistMessages}
        options={{
          title: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#E53E3E',
          },
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={PharmacistProfile}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  )
}

export default PharmacistTabs