import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useCart } from '../context/CartContext'
import { UserTabParamList } from './types'
import HomeScreen from '../app/(tabs)/index'
import CartScreen from '../app/(tabs)/cart'
import DeliveriesScreen from '../app/(tabs)/deliveries'
import ProfileScreen from '../app/(tabs)/profile'

const Tab = createBottomTabNavigator<UserTabParamList>()

const UserTabs: React.FC = () => {
  const { cartCount } = useCart()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline'
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline'
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'cube' : 'cube-outline'
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
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#E53E3E',
          },
        }}
      />
      <Tab.Screen 
        name="Deliveries" 
        component={DeliveriesScreen}
        options={{ title: 'Deliveries' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  )
}

export default UserTabs